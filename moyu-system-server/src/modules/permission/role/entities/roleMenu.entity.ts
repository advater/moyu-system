import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 角色和菜单关联实体
 */
export class RoleMenuDO extends TenantBaseDO {
  /**
   * ID 自增主键
   */
  id: number;
  /**
   * 角色ID
   */
  roleId: number;
  /**
   * 菜单ID
   */
  menuId: number;
}
