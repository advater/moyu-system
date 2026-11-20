import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 角色实体
 */
export class RoleDO extends TenantBaseDO {
  /**
   * 角色ID 自增主键
   */
  id: number;
  /**
   * 角色名称
   */
  name: string;
  /**
   * 角色标识
   *
   * 枚举
   */
  code: string;
  /**
   * 角色排序
   */
  sort: number;
  /**
   * 角色状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 角色类型
   *
   * 枚举 {@link RoleTypeEnum}
   */
  type: number;
  /**
   * 备注
   */
  remark: string;

  /**
   * 数据范围
   *
   * 枚举 {@link DataScopeEnum}
   */
  dataScope: number;
  /**
   * 数据范围(指定部门数组)
   *
   * 适用于 {@link #dataScope} 的值为 {@link DataScopeEnum#DEPT_CUSTOM} 时
   */
  dataScopeDeptIds: number[];
}
