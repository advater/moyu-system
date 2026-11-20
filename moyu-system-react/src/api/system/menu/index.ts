import { request } from "@/utils/request";
import type { MenuVO } from "./types";
export type { MenuVO };

// 查询菜单（精简）列表
export const getSimpleMenusList = () => {
  return request.get<MenuVO[]>({ url: "/menu/simple-list" });
};

// 查询菜单列表
export const getMenuList = (params?: Record<string, any>) => {
  return request.get<MenuVO[]>({ url: "/menu/list", params });
};

// 查询菜单详情
export const getMenu = (id: number) => {
  return request.get<MenuVO>({ url: "/menu/get", params: { id } });
};

// 新增菜单
export const createMenu = (data: Partial<MenuVO>) => {
  return request.post({ url: "/menu/create", data });
};

// 修改菜单
export const updateMenu = (data: Partial<MenuVO>) => {
  return request.put({ url: "/menu/update", data });
};

// 删除菜单
export const deleteMenu = (id: number) => {
  return request.delete({ url: "/menu/delete", params: { id } });
};

export const deleteMenuList = (ids: number[]) => {
  return request.delete({ url: "/menu/delete-list", params: { ids: ids.join(",") } });
};
