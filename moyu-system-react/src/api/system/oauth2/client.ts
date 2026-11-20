import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { OAuth2ClientVO } from "./types";
export type { OAuth2ClientVO };

// 查询 OAuth2 客户端的列表
export const getOAuth2ClientPage = (params: PageParam) => {
  return request.get<{ list: OAuth2ClientVO[]; total: number }>({
    url: "/oauth2-client/page",
    params,
  });
};

// 查询 OAuth2 客户端的详情
export const getOAuth2Client = (id: number) => {
  return request.get<OAuth2ClientVO>({ url: "/oauth2-client/get", params: { id } });
};

// 新增 OAuth2 客户端
export const createOAuth2Client = (data: Partial<OAuth2ClientVO>) => {
  return request.post({ url: "/oauth2-client/create", data });
};

// 修改 OAuth2 客户端
export const updateOAuth2Client = (data: Partial<OAuth2ClientVO>) => {
  return request.put({ url: "/oauth2-client/update", data });
};

// 删除 OAuth2
export const deleteOAuth2Client = (id: number) => {
  return request.delete({ url: "/oauth2-client/delete", params: { id } });
};

// 批量删除 OAuth2 客户端
export const deleteOAuth2ClientList = (ids: number[]) => {
  return request.delete({ url: "/oauth2-client/delete-list", params: { ids: ids.join(",") } });
};
