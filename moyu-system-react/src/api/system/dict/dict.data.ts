import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { DictDataVO } from "./types";
export type { DictDataVO };

// 查询字典数据（精简)列表
export const getSimpleDictDataList = () => {
  return request.get({ url: "/dict-data/simple-list" });
};

export const getDictDataListByTypes = (dictTypes: string[]) => {
  return request.get({ url: "/dict-data/list-by-types", params: { dictTypes } });
};

// 查询字典数据列表
export const getDictDataPage = (params: PageParam) => {
  return request.get<{ list: DictDataVO[]; total: number }>({ url: "/dict-data/page", params });
};

// 查询字典数据详情
export const getDictData = (id: number) => {
  return request.get<DictDataVO>({ url: "/dict-data/get", params: { id } });
};

// 新增字典数据
export const createDictData = (data: Partial<DictDataVO>) => {
  return request.post({ url: "/dict-data/create", data });
};

// 修改字典数据
export const updateDictData = (data: Partial<DictDataVO>) => {
  return request.put({ url: "/dict-data/update", data });
};

// 删除字典数据
export const deleteDictData = (id: number) => {
  return request.delete({ url: "/dict-data/delete", params: { id } });
};

// 批量删除字典数据
export const deleteDictDataList = (ids: number[]) => {
  return request.delete({ url: "/dict-data/delete-list", params: { ids: ids.join(",") } });
};

// 导出字典数据
export const exportDictData = (params: PageParam) => {
  return request.download({ url: "/dict-data/export-excel", params });
};
