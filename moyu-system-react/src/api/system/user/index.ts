import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { UserVO } from "./types";
export type { UserVO };

// 获取用户精简信息列表
export const getSimpleUserList = (deptId?: number): Promise<UserVO[]> => {
  return request.get({ url: "/user/simple-list", params: deptId ? { deptId } : undefined });
};

// 查询用户管理列表
export const getUserPage = (params: PageParam) => {
  return request.get<{ list: UserVO[]; total: number }>({ url: "/user/page", params });
};

// 查询用户详情
export const getUser = (id: number) => {
  return request.get<UserVO>({ url: "/user/get", params: { id } });
};

// 新增用户
export const createUser = (data: Partial<UserVO> & { password?: string }) => {
  return request.post({ url: "/user/create", data });
};

// 修改用户
export const updateUser = (data: Partial<UserVO>) => {
  return request.put({ url: "/user/update", data });
};

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete({ url: "/user/delete", params: { id } });
};

// 批量删除用户
export const deleteUserList = (ids: number[]) => {
  return request.delete({ url: "/user/delete-list", params: { ids: ids.join(",") } });
};

// 导出用户
export const exportUser = (params: PageParam) => {
  return request.download({ url: "/user/export-excel", params });
};

// 下载用户导入模板
export const importUserTemplate = () => {
  return request.download({ url: "/user/get-import-template" });
};

export const importUser = (file: File, updateSupport: boolean) => {
  const data = new FormData();
  data.append("file", file);
  return request.upload({ url: `/user/import?updateSupport=${updateSupport}`, data });
};

// 用户密码重置
export const resetUserPassword = (id: number, password: string) => {
  return request.put({ url: "/user/update-password", data: { id, password } });
};

// 用户状态修改
export const updateUserStatus = (id: number, status: number) => {
  return request.put({ url: "/user/update-status", data: { id, status } });
};

export const getUserList = (ids: number[]) => {
  return request.get<UserVO[]>({ url: "/user/list", params: { ids } });
};

export const getSimpleUser = (id: number) => {
  return request.get<UserVO>({ url: "/user/get-simple", params: { id } });
};

export const getUserListByNickname = (nickname: string) => {
  return request.get<UserVO[]>({ url: "/user/list-by-nickname", params: { nickname } });
};
