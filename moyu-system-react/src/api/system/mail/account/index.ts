import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { MailAccountVO } from "./types";
export type { MailAccountVO };

// 查询邮箱账号列表
export const getMailAccountPage = (params: PageParam) => {
  return request.get<{ list: MailAccountVO[]; total: number }>({
    url: "/mail-account/page",
    params,
  });
};

// 查询邮箱账号详情
export const getMailAccount = (id: number) => {
  return request.get<MailAccountVO>({ url: "/mail-account/get", params: { id } });
};

// 新增邮箱账号
export const createMailAccount = (data: Partial<MailAccountVO>) => {
  return request.post({ url: "/mail-account/create", data });
};

// 修改邮箱账号
export const updateMailAccount = (data: Partial<MailAccountVO>) => {
  return request.put({ url: "/mail-account/update", data });
};

// 删除邮箱账号
export const deleteMailAccount = (id: number) => {
  return request.delete({ url: "/mail-account/delete", params: { id } });
};

// 批量删除邮箱账号
export const deleteMailAccountList = (ids: number[]) => {
  return request.delete({ url: "/mail-account/delete-list", params: { ids: ids.join(",") } });
};

// 获得邮箱账号精简列表
export const getSimpleMailAccountList = () => {
  return request.get<MailAccountVO[]>({ url: "/mail-account/simple-list" });
};
