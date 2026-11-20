import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { OperateLogVO } from "./types";
export type { OperateLogVO };

// 查询操作日志列表
export const getOperateLogPage = (params: PageParam) => {
  return request.get<{ list: OperateLogVO[]; total: number }>({
    url: "/operate-log/page",
    params,
  });
};

export const getOperateLog = (id: number) => {
  return request.get<OperateLogVO>({ url: "/operate-log/get", params: { id } });
};

// 导出操作日志
export const exportOperateLog = (params: PageParam) => {
  return request.download({ url: "/operate-log/export-excel", params });
};
