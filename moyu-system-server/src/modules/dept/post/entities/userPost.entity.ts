import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 用户关联岗位实体
 */
export class UserPostDO extends TenantBaseDO {
  /**
   * ID 自增主键
   */
  id: number;
  /**
   * 用户 ID
   *
   * 关联 {@link UserDO#getId()}
   */
  userId: number;
  /**
   * 岗位 ID
   *
   * 关联 {@link PostDO#getId()}
   */
  postId: number;
}
