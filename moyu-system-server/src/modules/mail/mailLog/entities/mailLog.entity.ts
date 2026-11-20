import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 邮件日志实体
 */
export class MailLogDO extends TenantBaseDO {
  /**
   * 日志编号，自增
   */
  id: bigint;
  /**
   * 用户编码
   */
  userId: number;
  /**
   * 用户类型
   *
   * 枚举 {@link UserTypeEnum}
   */
  userType: number;
  /**
   * 接收邮箱地址
   */
  toMails: string;
  /**
   * 抄送邮箱地址
   */
  ccMails: string;
  /**
   * 密送邮箱地址
   */
  bccMails: string;
  /**
   * 邮箱账号编号
   *
   * 关联 {@link MailAccountDO#getId()}
   */
  accountId: number;
  /**
   * 发送邮箱地址
   *
   * 冗余 {@link MailAccountDO#getMail()}
   */
  fromMail: string;

  // ========= 模板相关字段 =========
  /**
   * 模版编号
   *
   * 关联 {@link MailTemplateDO#getId()}
   */
  templateId: number;
  /**
   * 模版编码
   *
   * 冗余 {@link MailTemplateDO#getCode()}
   */
  templateCode: string;
  /**
   * 模版发送人名称
   *
   * 冗余 {@link MailTemplateDO#getNickname()}
   */
  templateNickname: string;
  /**
   * 模版标题
   */
  templateTitle: string;
  /**
   * 模版内容
   *
   * 基于 {@link MailTemplateDO#getContent()} 格式化后的内容
   */
  templateContent: string;
  /**
   * 模版参数
   *
   * 基于 {@link MailTemplateDO#getParams()} 输入后的参数
   */
  templateParams: Record<string, any>;

  // ========= 发送相关字段 =========
  /**
   * 发送状态
   *
   * 枚举 {@link MailSendStatusEnum}
   */
  sendStatus: number;
  /**
   * 发送时间
   */
  sendTime: Date;
  /**
   * 发送返回的消息 ID
   */
  sendMessageId: string;
  /**
   * 发送异常
   */
  sendException: string;
}
