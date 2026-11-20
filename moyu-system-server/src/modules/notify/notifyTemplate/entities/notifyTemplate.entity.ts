import { TenantBaseDO } from '@/types/tenantBase.do';
/**
 * 站内信模版实体
 */
export class NotifyTemplateDO extends TenantBaseDO {
  /**
   * 站内信模版ID 自增主键
   */
  id: number;
  /**
   * 模版名称
   */
  name: string;
  /**
   * 模版编码
   */
  code: string;
  /**
   * 模版类型
   *
   * 对应 system_notify_template_type 字典
   */
  type: number;
  /**
   * 发送人名称
   */
  nickname: string;
  /**
   * 模版内容
   */
  content: string;
  /**
   * 参数数组
   */
  params: string[];
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
