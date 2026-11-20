import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { TenantPackageVO } from "./types";
export type { TenantPackageVO };

// 查询租户套餐列表
export const getTenantPackagePage = (params: PageParam) => {
  return request.get<{ list: TenantPackageVO[]; total: number }>({
    url: "/tenant-package/page",
    params,
  });
};

// 查询租户套餐详情
export const getTenantPackage = (id: number) => {
  return request.get<TenantPackageVO>({ url: "/tenant-package/get", params: { id } });
};

// 新增租户套餐
export const createTenantPackage = (data: Partial<TenantPackageVO>) => {
  return request.post({ url: "/tenant-package/create", data });
};

// 修改租户套餐
export const updateTenantPackage = (data: Partial<TenantPackageVO>) => {
  return request.put({ url: "/tenant-package/update", data });
};

// 删除租户套餐
export const deleteTenantPackage = (id: number) => {
  return request.delete({ url: "/tenant-package/delete", params: { id } });
};

// 批量删除租户套餐
export const deleteTenantPackageList = (ids: number[]) => {
  return request.delete({ url: "/tenant-package/delete-list", params: { ids: ids.join(",") } });
};

// 获取租户套餐精简信息列表
export const getTenantPackageList = () => {
  return request.get<TenantPackageVO[]>({ url: "/tenant-package/simple-list" });
};

export const getTenantPackageListByMenuId = (menuId: number) => {
  return request.get<TenantPackageVO[]>({
    url: "/tenant-package/list-by-menu-id",
    params: { menuId },
  });
};
