import { request } from "@/utils/request";
import type { DeptVO } from "./types";
export type { DeptVO };

// 查询部门（精简)列表
export const getSimpleDeptList = (): Promise<DeptVO[]> => {
  return request.get({ url: "/dept/simple-list" });
};

// 查询部门列表
export const getDeptList = (params?: Record<string, any>) => {
  return request.get<DeptVO[]>({ url: "/dept/list", params });
};

// 查询部门详情
export const getDept = (id: number) => {
  return request.get<DeptVO>({ url: "/dept/get", params: { id } });
};

// 新增部门
export const createDept = (data: Partial<DeptVO>) => {
  return request.post({ url: "/dept/create", data });
};

// 修改部门
export const updateDept = (data: Partial<DeptVO>) => {
  return request.put({ url: "/dept/update", data });
};

// 删除部门
export const deleteDept = (id: number) => {
  return request.delete({ url: "/dept/delete", params: { id } });
};

// 批量删除部门
export const deleteDeptList = (ids: number[]) => {
  return request.delete({ url: "/dept/delete-list", params: { ids: ids.join(",") } });
};
