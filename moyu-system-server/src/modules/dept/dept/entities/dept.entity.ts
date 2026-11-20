import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 部门实体
 */
export class DeptDO extends TenantBaseDO {
  /**
   * 部门ID 自增主键
   */
  id: number;
  /**
   * 部门名称
   */
  name: string;
  /**
   * 父部门ID
   *
   * 关联 {@link #id}
   */
  parentId: number;
  /**
   * 显示顺序
   */
  sort: number;
  /**
   * 负责人
   *
   * 关联 {@link UserDO#getId()}
   */
  leaderUserId: number;
  /**
   * 联系电话
   */
  phone: string;
  /**
   * 邮箱
   */
  email: string;
  /**
   * 部门状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
}
