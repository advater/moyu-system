import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { MailLogVO } from "./types";
export type { MailLogVO };

// 查询邮件日志列表
export const getMailLogPage = (params: PageParam) => {
  return request.get<{ list: MailLogVO[]; total: number }>({ url: "/mail-log/page", params });
};

// 查询邮件日志详情
export const getMailLog = (id: number) => {
  return request.get<MailLogVO>({ url: "/mail-log/get", params: { id } });
};
