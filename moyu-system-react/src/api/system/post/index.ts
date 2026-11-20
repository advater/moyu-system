import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { PostVO } from "./types";
export type { PostVO };

// 查询岗位列表
export const getPostPage = (params: PageParam) => {
  return request.get<{ list: PostVO[]; total: number }>({ url: "/post/page", params });
};

// 获取岗位精简信息列表
export const getSimplePostList = (): Promise<PostVO[]> => {
  return request.get({ url: "/post/simple-list" });
};

// 查询岗位详情
export const getPost = (id: number) => {
  return request.get<PostVO>({ url: "/post/get", params: { id } });
};

// 新增岗位
export const createPost = (data: Partial<PostVO>) => {
  return request.post({ url: "/post/create", data });
};

// 修改岗位
export const updatePost = (data: Partial<PostVO>) => {
  return request.put({ url: "/post/update", data });
};

// 删除岗位
export const deletePost = (id: number) => {
  return request.delete({ url: "/post/delete", params: { id } });
};

// 批量删除岗位
export const deletePostList = (ids: number[]) => {
  return request.delete({ url: "/post/delete-list", params: { ids: ids.join(",") } });
};

// 导出岗位
export const exportPost = (params: PageParam) => {
  return request.download({ url: "/post/export-excel", params });
};
