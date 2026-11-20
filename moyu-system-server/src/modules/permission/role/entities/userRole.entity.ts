import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 用户和角色关联实体
 */
export class UserRoleDO extends TenantBaseDO {
  /**
   * ID 自增主键
   */
  id: number;
  /**
   * 用户 ID
   */
  userId: number;
  /**
   * 角色 ID
   */
  roleId: number;
}
