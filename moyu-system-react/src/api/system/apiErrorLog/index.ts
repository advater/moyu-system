import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { ApiErrorLogVO } from "./types";
export type { ApiErrorLogVO };

// 查询 API 错误日志
export const getApiErrorLogPage = (params: PageParam) => {
  return request.get<{ list: ApiErrorLogVO[]; total: number }>({
    url: "/api-error-log/page",
    params,
  });
};

export const getApiErrorLog = (id: number) => {
  return request.get<ApiErrorLogVO>({ url: "/api-error-log/get", params: { id } });
};

// 更新 API 错误日志的处理状态
export const updateApiErrorLogPage = (id: number, processStatus: number) => {
  return request.put({
    url: "/api-error-log/update-status",
    data: { id, processStatus },
  });
};

export const updateApiErrorLogStatus = updateApiErrorLogPage;
