import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { ApiAccessLogVO } from "./types";
export type { ApiAccessLogVO };

// 查询 API 访问日志
export const getApiAccessLogPage = (params: PageParam) => {
  return request.get<{ list: ApiAccessLogVO[]; total: number }>({
    url: "/api-access-log/page",
    params,
  });
};

export const getApiAccessLog = (id: number) => {
  return request.get<ApiAccessLogVO>({ url: "/api-access-log/get", params: { id } });
};
