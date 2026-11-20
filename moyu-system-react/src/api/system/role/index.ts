import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { RoleVO } from "./types";
export type { RoleVO };

// 查询角色列表
export const getRolePage = (params: PageParam) => {
  return request.get<{ list: RoleVO[]; total: number }>({ url: "/role/page", params });
};

// 查询角色（精简)列表
export const getSimpleRoleList = (): Promise<RoleVO[]> => {
  return request.get({ url: "/role/simple-list" });
};

// 查询角色详情
export const getRole = (id: number) => {
  return request.get<RoleVO>({ url: "/role/get", params: { id } });
};

// 新增角色
export const createRole = (data: Partial<RoleVO>) => {
  return request.post({ url: "/role/create", data });
};

// 修改角色
export const updateRole = (data: Partial<RoleVO>) => {
  return request.put({ url: "/role/update", data });
};

// 删除角色
export const deleteRole = (id: number) => {
  return request.delete({ url: "/role/delete", params: { id } });
};

// 批量删除角色
export const deleteRoleList = (ids: number[]) => {
  return request.delete({ url: "/role/delete-list", params: { ids: ids.join(",") } });
};

// 导出角色
export const exportRole = (params: PageParam) => {
  return request.download({ url: "/role/export-excel", params });
};

export const copyRole = (data: { id: number; name: string; code: string }) => {
  return request.post({ url: "/role/copy", data });
};
