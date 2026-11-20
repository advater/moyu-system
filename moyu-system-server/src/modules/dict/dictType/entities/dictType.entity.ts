import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 字典类型表
 */
export class DictTypeDO extends TenantBaseDO {
  /**
   * 字典类型ID 自增主键
   */
  id: number;
  /**
   * 字典名称
   */
  name: string;
  /**
   * 字典类型
   */
  type: string;
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

  /**
   * 删除时间
   */
  deleted_at: Date;
}
