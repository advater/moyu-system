import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { OAuth2TokenVO } from "./types";
export type { OAuth2TokenVO };

// 查询 token 列表
export const getAccessTokenPage = (params: PageParam) => {
  return request.get<{ list: OAuth2TokenVO[]; total: number }>({
    url: "/oauth2-token/page",
    params,
  });
};

export const getOnlineUserPage = (params: PageParam) => {
  return request.get<{ list: OAuth2TokenVO[]; total: number }>({
    url: "/oauth2-token/online-page",
    params,
  });
};

// 删除 token
export const deleteAccessToken = (accessToken: string) => {
  return request.delete({ url: "/oauth2-token/delete", params: { accessToken } });
};

export const deleteAccessTokenList = (accessTokens: string[]) => {
  return request.delete({ url: "/oauth2-token/delete-list", params: { accessTokens } });
};

export const forceLogout = (userId: number, userType?: number) => {
  return request.put({ url: "/oauth2-token/force-logout", data: { userId, userType } });
};
