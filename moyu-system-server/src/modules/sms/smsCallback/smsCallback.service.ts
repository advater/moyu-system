import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RedisService } from '@/plugins/redis/redis.service';
import {
  SMS_CODE_PREFIX,
  SMS_CODE_EXPIRE,
  SMS_RESEND_INTERVAL,
  SMS_CODE_DAILY_LIMIT,
  resolveSmsTemplateCode,
} from '@/config/constants';
import { SmsError } from '@/config/error-messages';
import { SmsCodeRepository } from './repositories/smsCode.repository';
import { SmsCodeDO } from './entities/smsCode.entity';
import { SmsTemplateService } from '../smsTemplate/smsTemplate.service';
import { SmsLogService } from '../smsLog/smsLog.service';
import { SmsReceiveStatusEnum } from '../smsChannel/smsChannel.client';
import { SmsTemplateSendReqDTO } from '../smsTemplate/dto/SmsTemplateSendReq.dto';
import { assertSmsCallbackToken, SmsCallbackAuthError } from './sms-callback-auth';
import { assertSmsCallbackHmac } from './sms-callback-hmac';
import {
  assertAliyunSmsCallbackSign,
  assertTencentSmsCallbackSign,
} from './sms-callback-vendor';
import { TenantContext } from '@/common/tenant/tenant.context';

type ReceiveReport = {
  serialNo?: string;
  mobile?: string;
  success: boolean;
  code?: string;
  msg?: string;
};

/**
 * 短信回调 Service
 */
@Injectable()
export class SmsCallbackService {
  private readonly logger = new Logger(SmsCallbackService.name);

  constructor(
    private readonly smsCodeRepository: SmsCodeRepository,
    private readonly redisService: RedisService,
    private readonly smsTemplateService: SmsTemplateService,
    private readonly smsLogService: SmsLogService,
  ) {}

  /**
   * 校验短信厂商回调凭证
   *
   * - SMS_CALLBACK_SECRET：Header x-sms-callback-token（禁止 Query）
   * - SMS_CALLBACK_HMAC_SECRET：可选通用 HMAC
   * - SMS_TENCENT_APP_KEY / SMS_ALIYUN_ACCESS_KEY_SECRET：可选厂商签名
   */
  assertCallbackAuthorized(
    token?: string,
    hmacSignature?: string,
    rawBody?: string | Buffer,
    vendor?: 'aliyun' | 'tencent' | 'huawei' | 'qiniu',
    vendorSignature?: string,
  ): void {
    try {
      const result = assertSmsCallbackToken(token);
      if (result === 'dev-skip') {
        this.logger.warn(
          'SMS_CALLBACK_SECRET 未配置，开发环境跳过回调验签（生产将拒绝）',
        );
      }
      const hmac = assertSmsCallbackHmac(rawBody, hmacSignature);
      if (hmac === 'ok') {
        this.logger.debug('短信回调 HMAC 验签通过');
      }
      if (vendor === 'tencent') {
        assertTencentSmsCallbackSign(rawBody, vendorSignature);
      } else if (vendor === 'aliyun') {
        assertAliyunSmsCallbackSign(rawBody, vendorSignature);
      }
    } catch (err) {
      if (err instanceof SmsCallbackAuthError) {
        throw new HttpException(err.message, err.statusCode);
      }
      throw err;
    }
  }

  // ─── 各厂商短信状态回调 ─────────────────────────────

  /**
   * 阿里云短信状态回调
   * @see https://help.aliyun.com/document_detail/120998.html
   */
  async receiveAliyunSmsStatus(body: unknown): Promise<boolean> {
    const items = this.asArray(body);
    for (const item of items) {
      const row = item as Record<string, unknown>;
      await this.applyReceiveReport({
        serialNo: String(row.biz_id ?? row.bizId ?? ''),
        mobile: String(row.phone_number ?? row.phoneNumber ?? ''),
        success:
          row.success === true ||
          String(row.err_code ?? row.errCode ?? '').toUpperCase() ===
            'DELIVERED',
        code: String(row.err_code ?? row.errCode ?? ''),
        msg: String(row.err_msg ?? row.errMsg ?? ''),
      });
    }
    return true;
  }

  /**
   * 腾讯云短信状态回调
   * @see https://cloud.tencent.com/document/product/382/52077
   */
  async receiveTencentCloudSmsStatus(body: unknown): Promise<boolean> {
    const items = this.asArray(body);
    for (const item of items) {
      const row = item as Record<string, unknown>;
      const status = String(
        row.report_status ?? row.reportStatus ?? '',
      ).toUpperCase();
      await this.applyReceiveReport({
        serialNo: String(row.sid ?? row.serial_no ?? ''),
        mobile: String(row.mobile ?? row.phone_number ?? ''),
        success: status === 'SUCCESS' || status === 'SUCCESSFUL',
        code: status,
        msg: String(row.errmsg ?? row.description ?? ''),
      });
    }
    return true;
  }

  /**
   * 华为云短信状态回调
   * @see https://support.huaweicloud.com/api-msgsms/sms_05_0003.html
   */
  async receiveHuaweiSmsStatus(body: unknown): Promise<boolean> {
    const root = (body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(root)
      ? root
      : Array.isArray(root.status)
        ? (root.status as unknown[])
        : this.asArray(body);
    for (const item of items) {
      const row = item as Record<string, unknown>;
      const status = String(row.status ?? '').toUpperCase();
      await this.applyReceiveReport({
        serialNo: String(row.smsMsgId ?? row.sms_msg_id ?? ''),
        mobile: String(row.to ?? row.mobile ?? ''),
        success: status === 'DELIVRD' || status === 'SUCCESS' || status === '0',
        code: status,
        msg: String(row.statusDesc ?? row.description ?? ''),
      });
    }
    return true;
  }

  /**
   * 七牛云短信状态回调
   * @see https://developer.qiniu.com/sms/5910/message-push
   */
  async receiveQiniuSmsStatus(body: unknown): Promise<boolean> {
    const root = (body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(root.items)
      ? (root.items as unknown[])
      : this.asArray(body);
    for (const item of items) {
      const row = item as Record<string, unknown>;
      const status = String(row.status ?? '').toLowerCase();
      await this.applyReceiveReport({
        serialNo: String(row.message_id ?? row.messageId ?? ''),
        mobile: String(row.mobile ?? ''),
        success: status === 'success' || status === 'delivered',
        code: status,
        msg: String(row.error ?? row.msg ?? ''),
      });
    }
    return true;
  }

  // ─── 短信验证码发送/校验 ─────────────────────────────

  /**
   * 发送短信验证码
   *
   * 1. Redis 60s 重发冷却；
   * 2. 生成验证码落库 + Redis；
   * 3. 按场景模板编码调用短信渠道真实下发（模板需预先配置）。
   */
  async sendSmsCode(
    mobile: string,
    scene: number,
    createIp?: string,
  ): Promise<SmsCodeDO> {
    if (!mobile) {
      throw new HttpException(
        SmsError.MOBILE_NOT_EMPTY,
        HttpStatus.BAD_REQUEST,
      );
    }
    const cooldownKey = `${SMS_CODE_PREFIX}:cooldown:${mobile}:${scene}`;
    const cooldown = await this.redisService.get<string>(cooldownKey);
    if (cooldown) {
      throw new HttpException(
        SmsError.CODE_SEND_TOO_FAST,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const todayCount = await this.smsCodeRepository.selectCountToday(
      mobile,
      scene,
    );
    if (todayCount >= SMS_CODE_DAILY_LIMIT) {
      throw new HttpException(
        `今日短信发送次数已达上限（${SMS_CODE_DAILY_LIMIT} 次）`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.randomCode();
    const record = await this.smsCodeRepository.insert({
      mobile,
      code,
      scene,
      createIp,
      todayIndex: todayCount + 1,
    });

    await this.redisService.set(
      `${SMS_CODE_PREFIX}:${mobile}:${scene}`,
      code,
      SMS_CODE_EXPIRE,
    );
    await this.redisService.set(cooldownKey, '1', SMS_RESEND_INTERVAL);

    // 真实下发：依赖短信模板（场景 → 模板编码）
    const templateCode = resolveSmsTemplateCode(scene);
    try {
      const sendReq = new SmsTemplateSendReqDTO();
      sendReq.mobile = mobile;
      sendReq.templateCode = templateCode;
      sendReq.templateParams = { code };
      await this.smsTemplateService.sendSms(sendReq);
    } catch (err) {
      // 发送失败时清理 Redis，避免用户拿不到码却被冷却锁死
      await this.redisService.delete(`${SMS_CODE_PREFIX}:${mobile}:${scene}`);
      await this.redisService.delete(cooldownKey);
      this.logger.error(
        `短信验证码下发失败 mobile=${mobile} scene=${scene} template=${templateCode}`,
        err instanceof Error ? err.stack : String(err),
      );
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        SmsError.SEND_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return record;
  }

  /**
   * 校验短信验证码
   */
  async verifySmsCode(
    mobile: string,
    scene: number,
    code: string,
  ): Promise<boolean> {
    if (!mobile || !code) {
      return false;
    }
    const redisKey = `${SMS_CODE_PREFIX}:${mobile}:${scene}`;
    const cachedCode = await this.redisService.get<string>(redisKey);
    if (cachedCode) {
      if (cachedCode === code) {
        await this.redisService.delete(redisKey);
        const record = await this.smsCodeRepository.selectByMobileAndScene(
          mobile,
          scene,
        );
        if (record && !record.used && record.code === code) {
          await this.smsCodeRepository.markUsed(record.id);
        }
        return true;
      }
      return false;
    }

    const record = await this.smsCodeRepository.selectByMobileAndScene(
      mobile,
      scene,
    );
    if (!record) {
      return false;
    }
    const expireAt = record.createTime.getTime() + SMS_CODE_EXPIRE;
    if (Date.now() > expireAt) {
      return false;
    }
    if (record.used || record.code !== code) {
      return false;
    }
    return this.smsCodeRepository.markUsed(record.id);
  }

  private async applyReceiveReport(report: ReceiveReport): Promise<void> {
    const prevIgnore = TenantContext.isIgnored();
    // 回执按流水号全局匹配，需跨租户查改
    TenantContext.setIgnore(true);
    try {
      let log =
        (report.serialNo
          ? await this.smsLogService.selectByApiSerialNo(report.serialNo)
          : null) ?? null;
      if (!log && report.mobile) {
        log = await this.smsLogService.selectLatestByMobile(report.mobile, 24);
      }
      if (!log) {
        this.logger.warn(
          `短信回执未匹配日志 serial=${report.serialNo || ''} mobile=${report.mobile || ''}`,
        );
        return;
      }
      await this.smsLogService.updateSmsReceiveResult(log.id, {
        receiveStatus: report.success
          ? SmsReceiveStatusEnum.SUCCESS
          : SmsReceiveStatusEnum.FAILURE,
        receiveTime: new Date(),
        apiReceiveCode: report.code,
        apiReceiveMsg: report.msg,
      });
    } finally {
      TenantContext.setIgnore(prevIgnore);
    }
  }

  private asArray(body: unknown): unknown[] {
    if (Array.isArray(body)) return body;
    if (body && typeof body === 'object') return [body];
    return [];
  }

  private randomCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
