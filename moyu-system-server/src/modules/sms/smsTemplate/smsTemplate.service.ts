import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SmsTemplatePageReqDTO,
  SmsTemplateResDTO,
  SmsTemplateSaveReqDTO,
  SmsTemplateSendReqDTO,
  SmsTemplateSimpleResDTO,
} from './dto/smsTemplate.dto';
import { SmsTemplateRepository } from './repositories/smsTemplate.repository';
import { SmsTemplateDO } from './entities/smsTemplate.entity';
import { SmsChannelRepository } from '../smsChannel/repositories/smsChannel.repository';
import { SmsLogRepository } from '../smsLog/repositories/smsLog.repository';
import { SmsLogService } from '../smsLog/smsLog.service';
import { sendSms, SmsSendStatusEnum } from '../smsChannel/smsChannel.client';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { CommonError, ExportError, SmsError } from '@/config/error-messages';
import { i18nKey } from '@/i18n';
import { SMS_SEND_QUEUE, DEFAULT_TENANT_ID } from '@/config/constants';
import { TenantContext } from '@/common/tenant/tenant.context';
import type { SmsSendJobData } from './sms-send.processor';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';

/**
 * 短信模板 Service
 */
@Injectable()
export class SmsTemplateService {
  private readonly logger = new Logger(SmsTemplateService.name);

  constructor(
    private readonly smsTemplateRepository: SmsTemplateRepository,
    private readonly smsChannelRepository: SmsChannelRepository,
    private readonly smsLogRepository: SmsLogRepository,
    private readonly smsLogService: SmsLogService,
    private readonly tenantPolicyService: TenantPolicyService,
    @InjectQueue(SMS_SEND_QUEUE) private readonly smsQueue: Queue,
  ) {}

  /** 默认异步；SMS_SEND_ASYNC=false 时同步 */
  private isSmsAsync(): boolean {
    const raw = process.env.SMS_SEND_ASYNC;
    if (raw === undefined || raw === '') return true;
    return raw !== 'false' && raw !== '0';
  }

  /**
   * 创建短信模板
   */
  async createSmsTemplate(req: SmsTemplateSaveReqDTO): Promise<number> {
    // 模板编码（code）不允许重复
    const exists = await this.smsTemplateRepository.selectByUnique({ code: req.code });
    if (exists) {
      throw new HttpException(
        SmsError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 短信渠道需存在，channelCode 为冗余字段，取渠道编码落库
    const channelCode = await this.smsTemplateRepository.selectChannelCodeById(req.channelId);
    if (!channelCode) {
      throw new HttpException(SmsError.CHANNEL_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    // create 语义下忽略前端传入的 id（数据库自增）；params 为 Json 列，由内容解析后数组原样传入，无需 stringify
    return this.smsTemplateRepository.insert({
      type: req.type,
      status: req.status,
      code: req.code,
      name: req.name,
      content: req.content,
      params: this.parseContentParams(req.content),
      remark: req.remark ?? null,
      apiTemplateId: req.apiTemplateId,
      channelId: req.channelId,
      channelCode,
    });
  }

  /**
   * 修改短信模板
   */
  async updateSmsTemplate(req: SmsTemplateSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(SmsError.TEMPLATE_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const template = await this.smsTemplateRepository.selectById(req.id);
    if (!template) {
      throw new HttpException(
        SmsError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 模板编码唯一（排除自身）
    const conflict = await this.smsTemplateRepository.selectByUnique({
      code: req.code,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(
        SmsError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 渠道变更时重新冗余渠道编码
    const channelCode =
      req.channelId === template.channelId
        ? template.channelCode
        : await this.smsTemplateRepository.selectChannelCodeById(req.channelId);
    if (!channelCode) {
      throw new HttpException(SmsError.CHANNEL_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    return this.smsTemplateRepository.updateById(req.id, {
      type: req.type,
      status: req.status,
      code: req.code,
      name: req.name,
      content: req.content,
      params: this.parseContentParams(req.content),
      remark: req.remark ?? template.remark,
      apiTemplateId: req.apiTemplateId,
      channelId: req.channelId,
      channelCode,
    });
  }

  /**
   * 删除短信模板
   */
  async deleteSmsTemplate(id: number): Promise<boolean> {
    // 存在性校验
    const template = await this.smsTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        SmsError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.smsTemplateRepository.deleteById(id);
  }

  /**
   * 批量删除短信模板
   */
  async deleteSmsTemplateList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.smsTemplateRepository.deleteBatchIds(ids);
  }

  /**
   * 获取短信模板详情
   */
  async getSmsTemplate(id: number): Promise<SmsTemplateResDTO> {
    const template = await this.smsTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        SmsError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(template);
  }

  /**
   * 分页查询短信模板
   */
  async getSmsTemplatePage(req: SmsTemplatePageReqDTO): Promise<PageResult<SmsTemplateResDTO>> {
    const { list, total } = await this.smsTemplateRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.code ? { code: { contains: req.code } } : {}),
        ...(req.content ? { content: { contains: req.content } } : {}),
        ...(req.apiTemplateId ? { apiTemplateId: { contains: req.apiTemplateId } } : {}),
        ...(req.type !== undefined ? { type: req.type } : {}),
        ...(req.status !== undefined ? { status: req.status } : {}),
        ...(req.channelId !== undefined ? { channelId: req.channelId } : {}),
        ...(req.createTime && req.createTime.length === 2
          ? {
              createTime: {
                gte: new Date(req.createTime[0]),
                lte: new Date(req.createTime[1]),
              },
            }
          : {}),
      },
    );
    return {
      list: list.map((template) => this.toResDTO(template)),
      total,
    };
  }

  /**
   * 获取短信模板精简列表（仅启用，用于下拉选项）
   */
  async getSimpleSmsTemplateList(): Promise<SmsTemplateSimpleResDTO[]> {
    return this.smsTemplateRepository.selectSimpleList({ status: 1 });
  }

  /**
   * 导出短信模板 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.smsTemplateRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((template) => ({
      id: template.id,
      name: template.name,
      code: template.code,
      type: template.type,
      status: template.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      createTime: formatDate(template.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.SMS_TEMPLATE),
      filename: `${xl(ExportError.SMS_TEMPLATE)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.NAME), key: 'name', width: 18 },
        { header: xl(ExportError.CODE), key: 'code', width: 18 },
        { header: xl(ExportError.TYPE), key: 'type', width: 10 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 发送短信
   *
   * 链路：查模板（code）→ 校验手机号与模板参数 → 按 {param} 渲染内容 →
   * 查渠道 → 落短信日志（sendStatus=0 初始化）→ 调用厂商 HTTP API 真实发送 →
   * 回写发送结果（sendStatus=10 成功 / 20 失败 + API 字段）→
   * 发送失败时抛出 HttpException(500)，让调用方感知失败。
   *
   * @returns 短信日志编号（sys_sms_log.id）
   */
  async sendSms(
    req: SmsTemplateSendReqDTO,
    loginUser?: LoginUser,
  ): Promise<number> {
    // 1. 查询短信模板（按模板编码，确保启用）
    const template = await this.smsTemplateRepository.selectByUnique({
      code: req.templateCode,
    });
    if (!template) {
      throw new HttpException(
        SmsError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (template.status !== 1) {
      throw new HttpException(
        i18nKey(SmsError.TEMPLATE_DISABLED, { code: template.code }),
        HttpStatus.BAD_REQUEST,
      );
    }

    const tenantId = TenantContext.getTenantId() || DEFAULT_TENANT_ID;
    await this.tenantPolicyService.assertSmsDailyLimit(tenantId);

    // 2. 校验手机号基本格式：1 开头、11 位数字
    const mobile = (req.mobile ?? '').trim();
    if (!/^1\d{10}$/.test(mobile)) {
      throw new HttpException(CommonError.MOBILE_INVALID, HttpStatus.BAD_REQUEST);
    }

    // 3. 校验模板参数完整性 + 按 {param} 占位符渲染正文
    const templateParams: Record<string, any> = req.templateParams ?? {};
    const paramNames: string[] = Array.isArray(template.params)
      ? (template.params as string[])
      : [];
    const missingKey = paramNames.find((key) => {
      const value = templateParams[key];
      return value === undefined || value === null || value === '';
    });
    if (missingKey !== undefined) {
      throw new HttpException(
        i18nKey(SmsError.SEND_TEMPLATE_PARAM_MISS, {
          key: missingKey,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
    const content = this.renderContent(template.content, templateParams);

    // 4. 查询短信渠道（模板关联渠道，确保启用）
    const channel = await this.smsChannelRepository.selectById(template.channelId);
    if (!channel) {
      throw new HttpException(
        SmsError.CHANNEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (channel.status !== 1) {
      throw new HttpException(
        i18nKey(SmsError.CHANNEL_DISABLED, { code: channel.code }),
        HttpStatus.BAD_REQUEST,
      );
    }

    // 5. 落短信日志（发送状态：0 初始化；userId/userType 可空）
    const log = await this.smsLogRepository.insert({
      channelId: channel.id,
      channelCode: channel.code,
      templateId: template.id,
      templateCode: template.code,
      templateType: template.type,
      templateContent: content,
      templateParams,
      apiTemplateId: template.apiTemplateId ?? null,
      mobile,
      userId: loginUser?.id ?? null,
      userType: loginUser?.userType ?? null,
      sendStatus: SmsSendStatusEnum.INIT,
    });

    const channelPayload = {
      code: channel.code,
      signature: channel.signature,
      apiKey: channel.apiKey,
      apiSecret: channel.apiSecret ?? '',
      callbackUrl: channel.callbackUrl ?? undefined,
    };
    const sendPayload = {
      mobile,
      apiTemplateId: template.apiTemplateId ?? '',
      templateParams,
      paramNames,
      content,
      callbackUrl: channel.callbackUrl ?? undefined,
    };

    if (this.isSmsAsync()) {
      const job: SmsSendJobData = {
        tenantId,
        logId: log.id,
        channelId: channel.id,
        mobile,
        apiTemplateId: template.apiTemplateId ?? '',
        templateParams,
        paramNames,
        content,
      };
      try {
        await this.smsQueue.add('send', job, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        });
        return log.id;
      } catch (err) {
        this.logger.warn(
          `短信入队失败，回退同步发送: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 6. 同步调用渠道客户端
    const sendResult = await sendSms(channelPayload, sendPayload);

    // 7. 回写发送结果
    await this.smsLogService.updateSmsSendResult(log.id, {
      sendStatus: sendResult.success
        ? SmsSendStatusEnum.SUCCESS
        : SmsSendStatusEnum.FAILURE,
      sendTime: new Date(),
      apiSendCode: sendResult.apiSendCode,
      apiSendMsg: sendResult.apiSendMsg,
      apiRequestId: sendResult.apiRequestId,
      apiSerialNo: sendResult.apiSerialNo,
    });

    // 8. 发送失败抛异常（厂商详情已写入短信日志）
    if (!sendResult.success) {
      throw new HttpException(
        SmsError.SEND_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return log.id;
  }

  /**
   * 短信模板内容渲染：将 {param} 占位符替换为传入参数值
   */
  private renderContent(
    content: string,
    templateParams: Record<string, any>,
  ): string {
    return content.replace(/\{([^{}]+)\}/g, (_match, key: string) => {
      const value = templateParams[key.trim()];
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * 短信模板 DO → ResDTO
   */
  private toResDTO(template: SmsTemplateDO): SmsTemplateResDTO {
    const resp = new SmsTemplateResDTO();
    resp.id = template.id;
    resp.type = template.type;
    resp.status = template.status;
    resp.code = template.code;
    resp.name = template.name;
    resp.content = template.content;
    resp.params = template.params ?? undefined;
    resp.remark = template.remark ?? undefined;
    resp.apiTemplateId = template.apiTemplateId;
    resp.channelId = template.channelId;
    resp.channelCode = template.channelCode;
    resp.createTime = formatDate(template.createTime);
    return resp;
  }

  /**
   * 根据内容占位符 {xxx} 自动解析参数数组（对应实体注释“参数数组(自动根据内容生成)”），
   * 结果以数组形式原样写入 Prisma Json 列，无需 stringify
   */
  private parseContentParams(content: string): string[] {
    const result: string[] = [];
    const regex = /\{([^{}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const param = match[1].trim();
      if (param && !result.includes(param)) {
        result.push(param);
      }
    }
    return result;
  }
}
