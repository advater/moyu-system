import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { SmsLogVO } from "./types";
export type { SmsLogVO };

// 查询短信日志列表
export const getSmsLogPage = (params: PageParam) => {
  return request.get<{ list: SmsLogVO[]; total: number }>({ url: "/sms-log/page", params });
};

export const getSmsLog = (id: number) => {
  return request.get<SmsLogVO>({ url: "/sms-log/get", params: { id } });
};

// 导出短信日志
export const exportSmsLog = (params: PageParam) => {
  return request.download({ url: "/sms-log/export-excel", params });
};
