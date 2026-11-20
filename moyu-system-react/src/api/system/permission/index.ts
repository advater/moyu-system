import { request } from "@/utils/request";
import type {
  PermissionAssignRoleDataScopeReqVO,
  PermissionAssignRoleMenuReqVO,
  PermissionAssignUserRoleReqVO,
} from "./types";
export type {
  PermissionAssignRoleDataScopeReqVO,
  PermissionAssignRoleMenuReqVO,
  PermissionAssignUserRoleReqVO,
};

// 查询角色拥有的菜单权限
export const getRoleMenuList = (roleId: number) => {
  return request.get<number[]>({ url: "/permission/list-role-menus", params: { roleId } });
};

// 赋予角色菜单权限
export const assignRoleMenu = (data: PermissionAssignRoleMenuReqVO) => {
  return request.post({ url: "/permission/assign-role-menu", data });
};

// 赋予角色数据权限
export const assignRoleDataScope = (data: PermissionAssignRoleDataScopeReqVO) => {
  return request.post({ url: "/permission/assign-role-data-scope", data });
};

// 查询用户拥有的角色数组
export const getUserRoleList = (userId: number) => {
  return request.get<number[]>({ url: "/permission/list-user-roles", params: { userId } });
};

// 赋予用户角色
export const assignUserRole = (data: PermissionAssignUserRoleReqVO) => {
  return request.post({ url: "/permission/assign-user-role", data });
};
