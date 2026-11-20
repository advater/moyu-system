import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  MailTemplatePageReqDTO,
  MailTemplateResDTO,
  MailTemplateSaveReqDTO,
  MailTemplateSendReqDTO,
  MailTemplateSimpleResDTO,
} from './dto/mailTemplate.dto';
import { MailTemplateRepository } from './repositories/mailTemplate.repository';
import { MailAccountRepository } from '../mailAccount/repositories/mailAccount.repository';
import { MailLogRepository } from '../mailLog/repositories/mailLog.repository';
import { MailTemplate } from './entities/mailTemplate.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { MailError } from '@/config/error-messages';
import { i18nKey } from '@/i18n';
import * as nodemailer from 'nodemailer';
import { MAIL_SEND_QUEUE } from '@/config/constants';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import type { MailSendJobData } from './mail-send.processor';

/**
 * 邮件模版管理 Service
 */
@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);

  constructor(
    private readonly mailTemplateRepository: MailTemplateRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly mailLogRepository: MailLogRepository,
    @InjectQueue(MAIL_SEND_QUEUE) private readonly mailQueue: Queue,
  ) {}

  /** 默认异步发送；MAIL_SEND_ASYNC=false 时同步 */
  private isMailAsync(): boolean {
    const raw = process.env.MAIL_SEND_ASYNC;
    if (raw === undefined || raw === '') return true;
    return raw !== 'false' && raw !== '0';
  }

  /**
   * 创建邮件模版
   */
  async createMailTemplate(req: MailTemplateSaveReqDTO): Promise<number> {
    // 模版编号（code）不允许重复
    const exists = await this.mailTemplateRepository.selectByUnique({ code: req.code });
    if (exists) {
      throw new HttpException(
        MailError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）；params 为 Json 列，由内容解析后数组原样传入
    return this.mailTemplateRepository.insert({
      name: req.name,
      code: req.code,
      accountId: req.accountId,
      nickname: req.nickname ?? null,
      title: req.title,
      content: req.content,
      params: this.parseContentParams(req.content),
      status: req.status,
      remark: req.remark ?? null,
    });
  }

  /**
   * 修改邮件模版
   */
  async updateMailTemplate(req: MailTemplateSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(MailError.TEMPLATE_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const template = await this.mailTemplateRepository.selectById(req.id);
    if (!template) {
      throw new HttpException(
        MailError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 模版编号唯一（排除自身）
    const conflict = await this.mailTemplateRepository.selectByUnique({
      code: req.code,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(
        MailError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.mailTemplateRepository.updateById(req.id, {
      name: req.name,
      code: req.code,
      accountId: req.accountId,
      nickname: req.nickname ?? template.nickname,
      title: req.title,
      content: req.content,
      params: this.parseContentParams(req.content),
      status: req.status,
      remark: req.remark ?? template.remark,
    });
  }

  /**
   * 删除邮件模版
   */
  async deleteMailTemplate(id: number): Promise<boolean> {
    // 存在性校验
    const template = await this.mailTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        MailError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.mailTemplateRepository.deleteById(id);
  }

  /**
   * 批量删除邮件模版
   */
  async deleteMailTemplateList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.mailTemplateRepository.deleteBatchIds(ids);
  }

  /**
   * 获取邮件模版详情
   */
  async getMailTemplate(id: number): Promise<MailTemplateResDTO> {
    const template = await this.mailTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        MailError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(template);
  }

  /**
   * 分页查询邮件模版
   */
  async getMailTemplatePage(
    req: MailTemplatePageReqDTO,
  ): Promise<PageResult<MailTemplateResDTO>> {
    const { list, total } = await this.mailTemplateRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.name ? { name: { contains: req.name } } : {}),
        ...(req.code ? { code: { contains: req.code } } : {}),
        ...(req.status !== undefined ? { status: req.status } : {}),
        ...(req.accountId !== undefined ? { accountId: req.accountId } : {}),
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
   * 获取邮件模版精简列表（仅启用，用于下拉选项）
   */
  async getSimpleMailTemplateList(): Promise<MailTemplateSimpleResDTO[]> {
    return this.mailTemplateRepository.selectSimpleList({ status: 1 });
  }

  /**
   * 按模版发送邮件
   *
   * 真实发送链路：加载启用中的模版 → 校验并渲染 {xxx} 占位参数 → 查询发件邮箱账号 →
   * 预写邮件日志（sendStatus=0）→ 经 nodemailer 走 SMTP 真实发送 →
   * 成功回写日志 sendStatus=10、失败回写 sendStatus=20 后抛 500，保证日志必然落库。
   * 返回邮件日志编号（id 数据库为 BigInt，对外以 number 返回）。
   */
  async sendMail(
    req: MailTemplateSendReqDTO,
    loginUser?: { id?: number; userType?: number },
  ): Promise<number> {
    // 接收邮箱不能为空
    if (!req.toMails || req.toMails.length === 0) {
      throw new HttpException(
        MailError.SEND_MAIL_NOT_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 1. 查询启用中的邮件模版（status=1；不存在或未启用统一按不存在处理）
    const template = await this.mailTemplateRepository.selectByUnique({
      code: req.templateCode,
      status: 1,
    });
    if (!template) {
      throw new HttpException(
        MailError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 2. 解析 content 中的 {xxx} 占位参数（{xxx?} 视为可选），校验必填项并渲染最终标题/内容
    const params = req.templateParams ?? {};
    const missingKeys = this.parsePlaceholders(template.content)
      .filter((item) => !item.optional)
      .map((item) => item.key)
      .filter((key) => params[key] === undefined || params[key] === null);
    if (missingKeys.length > 0) {
      throw new HttpException(
        i18nKey(MailError.SEND_TEMPLATE_PARAM_MISS, {
          key: missingKeys.join(','),
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
    const title = this.renderText(template.title, params);
    const content = this.renderText(template.content, params);
    // 3. 查询发送邮箱账号
    const account = await this.mailAccountRepository.selectById(template.accountId);
    if (!account) {
      throw new HttpException(
        MailError.ACCOUNT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 4. 预写邮件日志（发送中 sendStatus=0），邮箱集合以 JSON 数组字符串落库
    const log = await this.mailLogRepository.insert({
      userId: loginUser?.id ?? null,
      userType: loginUser?.userType ?? null,
      toMails: JSON.stringify(req.toMails),
      ccMails: JSON.stringify(req.ccMails ?? []),
      bccMails: JSON.stringify(req.bccMails ?? []),
      accountId: account.id,
      fromMail: account.mail,
      templateId: template.id,
      templateCode: template.code,
      templateNickname: template.nickname ?? null,
      templateTitle: title,
      templateContent: content,
      ...(req.templateParams ? { templateParams: req.templateParams } : {}),
      sendStatus: 0,
    });

    const from = template.nickname
      ? `${template.nickname}<${account.mail}>`
      : account.mail;
    const tenantId =
      TenantContext.getTenantId() || DEFAULT_TENANT_ID;

    if (this.isMailAsync()) {
      const job: MailSendJobData = {
        tenantId,
        logId: Number(log.id),
        accountId: account.id,
        from,
        to: req.toMails,
        cc: req.ccMails,
        bcc: req.bccMails,
        subject: title,
        html: content,
      };
      try {
        await this.mailQueue.add('send', job, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        });
        return Number(log.id);
      } catch (err) {
        this.logger.warn(
          `邮件入队失败，回退同步发送: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 5. 同步 SMTP 发送（异步关闭或入队失败时）
    try {
      const transporter = nodemailer.createTransport({
        host: account.host,
        port: account.port,
        secure: account.sslEnable,
        requireTLS: account.starttlsEnable,
        auth: {
          user: account.username,
          pass: account.password,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
      const info = await transporter.sendMail({
        from,
        to: req.toMails,
        ...(req.ccMails && req.ccMails.length > 0 ? { cc: req.ccMails } : {}),
        ...(req.bccMails && req.bccMails.length > 0 ? { bcc: req.bccMails } : {}),
        subject: title,
        html: content,
        text: content,
      });
      await this.mailLogRepository.updateById(log.id, {
        sendStatus: 10,
        sendTime: new Date(),
        sendMessageId: info.messageId ?? null,
      });
      return Number(log.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.mailLogRepository.updateById(log.id, {
        sendStatus: 20,
        sendTime: new Date(),
        sendException: errorMessage,
      });
      throw new HttpException(
        MailError.SEND_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 邮件模版 DO → ResDTO
   */
  private toResDTO(template: MailTemplate): MailTemplateResDTO {
    const resp = new MailTemplateResDTO();
    resp.id = template.id;
    resp.name = template.name;
    resp.code = template.code;
    resp.accountId = template.accountId;
    resp.nickname = template.nickname ?? undefined;
    resp.title = template.title;
    resp.content = template.content;
    resp.params = this.toParams(template.params);
    resp.status = template.status;
    resp.remark = template.remark ?? undefined;
    resp.createTime = formatDate(template.createTime);
    return resp;
  }

  /**
   * params 为 Json 列，运行时为字符串数组或 null（实体类型标注为 string 仅作占位）
   */
  private toParams(params: string): string[] | undefined {
    const value: unknown = params;
    return Array.isArray(value) ? (value as string[]) : undefined;
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

  /**
   * 解析文本中的 {xxx} 占位符，返回占位名与其是否可选的列表
   *
   * 占位符名称以 ? 结尾（如 {name?}）视为可选参数，解析时去掉尾部的 ?。
   */
  private parsePlaceholders(
    text: string,
  ): Array<{ key: string; optional: boolean }> {
    const result: Array<{ key: string; optional: boolean }> = [];
    const regex = /\{([^{}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const raw = match[1].trim();
      if (!raw) {
        continue;
      }
      const optional = raw.endsWith('?');
      const key = optional ? raw.slice(0, -1).trim() : raw;
      if (key && !result.some((item) => item.key === key)) {
        result.push({ key, optional });
      }
    }
    return result;
  }

  /**
   * 使用参数渲染文本中的 {xxx} 占位符
   *
   * 参数命中时替换为参数值；可选占位符（{xxx?}）缺失时替换为空串，
   * 必填占位符缺失在发送前已校验，理论上不会走到保留原占位符的分支。
   */
  private renderText(text: string, params: Record<string, any>): string {
    if (!text) {
      return '';
    }
    return text.replace(/\{([^{}]+)\}/g, (match, raw: string) => {
      const name = raw.trim();
      const optional = name.endsWith('?');
      const key = optional ? name.slice(0, -1).trim() : name;
      const value = params[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
      // 可选参数缺失替换为空串；必填参数缺失理论上在参数校验时已拦截
      return optional ? '' : match;
    });
  }
}
