import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { JobLogVO } from "./types";
export type { JobLogVO };

// 任务日志列表
export const getJobLogPage = (params: PageParam) => {
  return request.get<{ list: JobLogVO[]; total: number }>({ url: "/job-log/page", params });
};

// 任务日志详情
export const getJobLog = (id: number) => {
  return request.get<JobLogVO>({ url: "/job-log/get", params: { id } });
};
