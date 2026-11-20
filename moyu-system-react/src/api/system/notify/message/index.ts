import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { NotifyMessageVO } from "./types";
export type { NotifyMessageVO };

// 查询站内信消息列表
export const getNotifyMessagePage = (params: PageParam) => {
  return request.get<{ list: NotifyMessageVO[]; total: number }>({
    url: "/notify-message/page",
    params,
  });
};

export const getNotifyMessage = (id: number) => {
  return request.get<NotifyMessageVO>({ url: "/notify-message/get", params: { id } });
};

// 获得我的站内信分页
export const getMyNotifyMessagePage = (params: PageParam) => {
  return request.get<{ list: NotifyMessageVO[]; total: number }>({
    url: "/notify-message/my-page",
    params,
  });
};

// 批量标记已读
export const updateNotifyMessageRead = (ids: number[]) => {
  return request.put({
    url: "/notify-message/update-read",
    params: { ids },
  });
};

// 标记所有站内信为已读
export const updateAllNotifyMessageRead = () => {
  return request.put({ url: "/notify-message/update-all-read" });
};

// 获取当前用户的最新站内信列表
export const getUnreadNotifyMessageList = (size = 10) => {
  return request.get<NotifyMessageVO[]>({
    url: "/notify-message/get-unread-list",
    params: { size },
  });
};

// 获得当前用户的未读站内信数量
export const getUnreadNotifyMessageCount = () => {
  return request.get<number>({ url: "/notify-message/get-unread-count" });
};
