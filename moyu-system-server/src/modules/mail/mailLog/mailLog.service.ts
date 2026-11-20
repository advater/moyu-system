import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MailLogPageReqDTO, MailLogResDTO } from './dto/mailLog.dto';
import { MailLogRepository } from './repositories/mailLog.repository';
import { MailLogDO } from './entities/mailLog.entity';
import { Prisma } from '@/generated/prisma/client';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { MailError } from '@/config/error-messages';

/**
 * 邮件日志管理 Service
 *
 * 日志类模块仅提供「写 + 只读查询」能力，不提供 update/delete。
 */
@Injectable()
export class MailLogService {
  constructor(private readonly mailLogRepository: MailLogRepository) {}

  /**
   * 新增邮件日志（供 MailService 发信后调用），返回插入行
   */
  async createMailLog(
    data: Prisma.SysMailLogUncheckedCreateInput,
  ): Promise<MailLogDO> {
    return this.mailLogRepository.insert(data);
  }

  /**
   * 获取邮件日志详情
   */
  async getMailLogInfo(id: number): Promise<MailLogResDTO> {
    const log = await this.mailLogRepository.selectById(id);
    if (!log) {
      throw new HttpException(MailError.LOG_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(log);
  }

  /**
   * 分页查询邮件日志
   */
  async getMailLogPage(
    req: MailLogPageReqDTO,
  ): Promise<PageResult<MailLogResDTO>> {
    const where: Prisma.SysMailLogWhereInput = {
      ...(req.userId !== undefined ? { userId: req.userId } : {}),
      ...(req.userType !== undefined ? { userType: req.userType } : {}),
      // 接收邮箱模糊匹配：DB 列 to_mails 为 Text（内容为邮箱集合的序列化字符串）
      ...(req.toMail ? { toMails: { contains: req.toMail } } : {}),
      ...(req.accountId !== undefined ? { accountId: req.accountId } : {}),
      ...(req.templateId !== undefined ? { templateId: req.templateId } : {}),
      ...(req.sendStatus !== undefined ? { sendStatus: req.sendStatus } : {}),
      // 发送时间范围 [开始时间, 结束时间]
      ...(req.sendTime && req.sendTime.length === 2
        ? {
            sendTime: {
              gte: new Date(req.sendTime[0]),
              lte: new Date(req.sendTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.mailLogRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return {
      list: list.map((log) => this.toResDTO(log)),
      total,
    };
  }

  /**
   * 邮件日志 DO → ResDTO
   */
  private toResDTO(log: MailLogDO): MailLogResDTO {
    const resp = new MailLogResDTO();
    // id 数据库类型为 BigInt，ResDTO 为 number：经 String 中转序列化（与 OperateLog.bizId 处理一致）
    resp.id = Number(String(log.id));
    resp.userId = log.userId ?? undefined;
    resp.userType = log.userType ?? undefined;
    resp.toMails = this.toMails(log.toMails);
    resp.ccMails = this.toMails(log.ccMails);
    resp.bccMails = this.toMails(log.bccMails);
    resp.accountId = log.accountId;
    resp.fromMail = log.fromMail;
    resp.templateId = log.templateId;
    resp.templateCode = log.templateCode;
    resp.templateNickname = log.templateNickname ?? undefined;
    resp.templateTitle = log.templateTitle;
    resp.templateContent = log.templateContent;
    resp.templateParams = log.templateParams;
    resp.sendStatus = log.sendStatus;
    resp.sendTime = log.sendTime ? formatDate(log.sendTime) : undefined;
    resp.sendMessageId = log.sendMessageId ?? undefined;
    resp.sendException = log.sendException ?? undefined;
    resp.createTime = formatDate(log.createTime);
    return resp;
  }

  /**
   * 邮箱集合转换：DB 列 to_mails/cc_mails/bcc_mails 为 Text（实体类型标注为 string，
   * 运行时内容为 JSON 数组字符串，兼容旧数据逗号分隔），ResDTO 以字符串数组对外输出。
   */
  private toMails(value?: string | null): string[] {
    if (!value) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // ignore：非 JSON 数据，走逗号/单值降级
    }
    return value.includes(',') ? value.split(',') : [value];
  }
}
