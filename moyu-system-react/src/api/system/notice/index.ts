import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { NoticeVO } from "./types";
export type { NoticeVO };

// 查询公告列表
export const getNoticePage = (params: PageParam) => {
  return request.get<{ list: NoticeVO[]; total: number }>({ url: "/notice/page", params });
};

// 查询公告详情
export const getNotice = (id: number) => {
  return request.get<NoticeVO>({ url: "/notice/get", params: { id } });
};

// 新增公告
export const createNotice = (data: Partial<NoticeVO>) => {
  return request.post({ url: "/notice/create", data });
};

// 修改公告
export const updateNotice = (data: Partial<NoticeVO>) => {
  return request.put({ url: "/notice/update", data });
};

// 删除公告
export const deleteNotice = (id: number) => {
  return request.delete({ url: "/notice/delete", params: { id } });
};

// 批量删除公告
export const deleteNoticeList = (ids: number[]) => {
  return request.delete({ url: "/notice/delete-list", params: { ids: ids.join(",") } });
};

export const pushNotice = (id: number) => {
  return request.post({ url: `/notice/push?id=${id}` });
};
