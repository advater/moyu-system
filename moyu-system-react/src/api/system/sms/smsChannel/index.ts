import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { SmsChannelVO } from "./types";
export type { SmsChannelVO };

// 查询短信渠道列表
export const getSmsChannelPage = (params: PageParam) => {
  return request.get<{ list: SmsChannelVO[]; total: number }>({
    url: "/sms-channel/page",
    params,
  });
};

// 获得短信渠道精简列表
export function getSimpleSmsChannelList() {
  return request.get<SmsChannelVO[]>({ url: "/sms-channel/simple-list" });
}

// 查询短信渠道详情
export const getSmsChannel = (id: number) => {
  return request.get<SmsChannelVO>({ url: "/sms-channel/get", params: { id } });
};

// 新增短信渠道
export const createSmsChannel = (data: Partial<SmsChannelVO>) => {
  return request.post({ url: "/sms-channel/create", data });
};

// 修改短信渠道
export const updateSmsChannel = (data: Partial<SmsChannelVO>) => {
  return request.put({ url: "/sms-channel/update", data });
};

// 删除短信渠道
export const deleteSmsChannel = (id: number) => {
  return request.delete({ url: "/sms-channel/delete", params: { id } });
};

// 批量删除短信渠道
export const deleteSmsChannelList = (ids: number[]) => {
  return request.delete({ url: "/sms-channel/delete-list", params: { ids: ids.join(",") } });
};
