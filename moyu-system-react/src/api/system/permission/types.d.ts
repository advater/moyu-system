export interface PermissionAssignUserRoleReqVO {
  userId: number;
  roleIds: number[];
}

export interface PermissionAssignRoleMenuReqVO {
  roleId: number;
  menuIds: number[];
}

export interface PermissionAssignRoleDataScopeReqVO {
  roleId: number;
  dataScope: number;
  dataScopeDeptIds?: number[];
}

