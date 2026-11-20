import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { NotifyTemplateVO, NotifySendReqVO } from "./types";
export type { NotifyTemplateVO, NotifySendReqVO };

// 查询站内信模板精简列表
export const getSimpleNotifyTemplateList = () => {
  return request.get<NotifyTemplateVO[]>({ url: "/notify-template/simple-list" });
};

// 查询站内信模板列表
export const getNotifyTemplatePage = (params: PageParam) => {
  return request.get<{ list: NotifyTemplateVO[]; total: number }>({
    url: "/notify-template/page",
    params,
  });
};

// 查询站内信模板详情
export const getNotifyTemplate = (id: number) => {
  return request.get<NotifyTemplateVO>({ url: "/notify-template/get", params: { id } });
};

// 新增站内信模板
export const createNotifyTemplate = (data: Partial<NotifyTemplateVO>) => {
  return request.post({ url: "/notify-template/create", data });
};

// 修改站内信模板
export const updateNotifyTemplate = (data: Partial<NotifyTemplateVO>) => {
  return request.put({ url: "/notify-template/update", data });
};

// 删除站内信模板
export const deleteNotifyTemplate = (id: number) => {
  return request.delete({ url: "/notify-template/delete", params: { id } });
};

// 批量删除站内信模板
export const deleteNotifyTemplateList = (ids: number[]) => {
  return request.delete({ url: "/notify-template/delete-list", params: { ids: ids.join(",") } });
};

// 发送站内信
export const sendNotify = (data: NotifySendReqVO) => {
  return request.post({ url: "/notify-template/send-notify", data });
};
