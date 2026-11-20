import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { TenantVO } from "./types";
export type { TenantVO };

// 查询租户列表
export const getTenantPage = (params: PageParam) => {
  return request.get<{ list: TenantVO[]; total: number }>({ url: "/tenant/page", params });
};

// 查询租户详情
export const getTenant = (id: number) => {
  return request.get<TenantVO>({ url: "/tenant/get", params: { id } });
};

// 获取租户精简信息列表
export const getTenantList = () => {
  return request.get<TenantVO[]>({ url: "/tenant/simple-list" });
};

export const getTenantIdByName = (name: string) => {
  return request.get<number>({ url: "/tenant/get-id-by-name", params: { name } });
};

export const getTenantByWebsite = (website: string) => {
  return request.get<TenantVO>({ url: "/tenant/get-by-website", params: { website } });
};

// 新增租户
export const createTenant = (data: Partial<TenantVO>) => {
  return request.post({ url: "/tenant/create", data });
};

// 修改租户
export const updateTenant = (data: Partial<TenantVO>) => {
  return request.put({ url: "/tenant/update", data });
};

// 删除租户
export const deleteTenant = (id: number) => {
  return request.delete({ url: "/tenant/delete", params: { id } });
};

// 批量删除租户
export const deleteTenantList = (ids: number[]) => {
  return request.delete({ url: "/tenant/delete-list", params: { ids: ids.join(",") } });
};

// 导出租户
export const exportTenant = (params: PageParam) => {
  return request.download({ url: "/tenant/export-excel", params });
};
