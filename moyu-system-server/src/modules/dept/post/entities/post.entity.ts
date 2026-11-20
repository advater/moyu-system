import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 岗位实体
 */
export class PostDO extends TenantBaseDO {
  /**
   * 岗位ID 自增主键
   */
  id: number;
  /**
   * 岗位名称
   */
  name: string;
  /**
   * 岗位编码
   */
  code: string;
  /**
   * 岗位排序
   */
  sort: number;
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
