import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { SocialUserVO } from "./types";
export type { SocialUserVO };

// 查询社交用户列表
export const getSocialUserPage = (params: PageParam) => {
  return request.get<{ list: SocialUserVO[]; total: number }>({
    url: "/social-user/page",
    params,
  });
};

// 查询社交用户详情
export const getSocialUser = (id: number) => {
  return request.get<SocialUserVO>({ url: "/social-user/get", params: { id } });
};

// 获得绑定社交用户列表
export const getBindSocialUserList = () => {
  return request.get<SocialUserVO[]>({ url: "/social-user/get-bind-list" });
};

export const socialBind = (data: { type: number; code: string; state: string }) => {
  return request.post({ url: "/social-user/bind", data });
};

export const socialUnbind = (data: { type: number; openid: string }) => {
  return request.delete({ url: "/social-user/unbind", data });
};
