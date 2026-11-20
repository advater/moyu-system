import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { DictTypeVO } from "./types";
export type { DictTypeVO };

// 查询字典（精简)列表
export const getSimpleDictTypeList = (): Promise<DictTypeVO[]> => {
  return request.get({ url: "/dict-type/simple-list" });
};

// 查询字典列表
export const getDictTypePage = (params: PageParam) => {
  return request.get<{ list: DictTypeVO[]; total: number }>({ url: "/dict-type/page", params });
};

// 查询字典详情
export const getDictType = (id: number) => {
  return request.get<DictTypeVO>({ url: "/dict-type/get", params: { id } });
};

// 新增字典
export const createDictType = (data: Partial<DictTypeVO>) => {
  return request.post({ url: "/dict-type/create", data });
};

// 修改字典
export const updateDictType = (data: Partial<DictTypeVO>) => {
  return request.put({ url: "/dict-type/update", data });
};

// 删除字典
export const deleteDictType = (id: number) => {
  return request.delete({ url: "/dict-type/delete", params: { id } });
};

// 批量删除字典类型
export const deleteDictTypeList = (ids: number[]) => {
  return request.delete({ url: "/dict-type/delete-list", params: { ids: ids.join(",") } });
};

// 导出字典
export const exportDictType = (params: PageParam) => {
  return request.download({ url: "/dict-type/export-excel", params });
};
