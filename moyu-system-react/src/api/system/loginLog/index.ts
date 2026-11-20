import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { LoginLogVO } from "./types";
export type { LoginLogVO };

// 查询登录日志列表
export const getLoginLogPage = (params: PageParam) => {
  return request.get<{ list: LoginLogVO[]; total: number }>({
    url: "/login-log/page",
    params,
  });
};

export const getLoginLog = (id: number) => {
  return request.get<LoginLogVO>({ url: "/login-log/get", params: { id } });
};

// 导出登录日志
export const exportLoginLog = (params: PageParam) => {
  return request.download({ url: "/login-log/export-excel", params });
};
