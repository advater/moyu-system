import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 邮件模版实体
 */
export class MailTemplate extends TenantBaseDO {
  /**
   * 邮件模版ID 自增主键
   */
  id: number;
  /**
   * 模版名称
   */
  name: string;
  /**
   * 模版编号
   */
  code: string;
  /**
   * 发送的邮箱账号编号
   *
   * 关联 {@link MailAccountDO#getId()}
   */
  accountId: number;
  /**
   * 发送人名称
   */
  nickname: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 内容
   */
  content: string;
  /**
   * 参数数组(自动根据内容生成)
   */
  params: string;
  /**
   * 状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 备注
   */
  remark: string;
}
