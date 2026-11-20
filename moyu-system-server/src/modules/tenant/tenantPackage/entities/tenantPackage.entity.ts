import { BaseDO } from '@/types/base.do';

/**
 * 租户套餐实体
 */
export class TenantPackageDO extends BaseDO {
  /**
   * 租户套餐ID 自增主键
   */
  id: number;
  /**
   * 套餐名，唯一
   */
  name: string;
  /**
   * 租户套餐状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 备注
   */
  remark: string;
  /**
   * 关联的菜单编号
   */
  menuIds: number[];
  /**
   * 套餐能力位（短信条数、存储配额等）
   */
  features?: Record<string, number | string | boolean> | null;
}
