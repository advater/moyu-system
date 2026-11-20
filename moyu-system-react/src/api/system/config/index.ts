import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { ConfigVO } from "./types";
export type { ConfigVO };

// 查询参数列表
export const getConfigPage = (params: PageParam) => {
  return request.get<{ list: ConfigVO[]; total: number }>({ url: "/config/page", params });
};

// 查询参数详情
export const getConfig = (id: number) => {
  return request.get<ConfigVO>({ url: "/config/get", params: { id } });
};

export const getSimpleConfigList = () => {
  return request.get<ConfigVO[]>({ url: "/config/simple-list" });
};

// 根据参数键名查询参数值
export const getConfigKey = (configKey: string) => {
  return request.get<string>({ url: "/config/get-value-by-key", params: { key: configKey } });
};

// 新增参数
export const createConfig = (data: Partial<ConfigVO>) => {
  return request.post({ url: "/config/create", data });
};

// 修改参数
export const updateConfig = (data: Partial<ConfigVO>) => {
  return request.put({ url: "/config/update", data });
};

// 删除参数
export const deleteConfig = (id: number) => {
  return request.delete({ url: "/config/delete", params: { id } });
};

// 批量删除参数
export const deleteConfigList = (ids: number[]) => {
  return request.delete({ url: "/config/delete-list", params: { ids: ids.join(",") } });
};
