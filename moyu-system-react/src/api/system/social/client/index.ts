import { request } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { SocialClientVO } from "./types";
export type { SocialClientVO };

// 查询社交客户端列表
export const getSocialClientPage = (params: PageParam) => {
  return request.get<{ list: SocialClientVO[]; total: number }>({
    url: "/social-client/page",
    params,
  });
};

// 查询社交客户端详情
export const getSocialClient = (id: number) => {
  return request.get<SocialClientVO>({ url: "/social-client/get", params: { id } });
};

// 新增社交客户端
export const createSocialClient = (data: Partial<SocialClientVO>) => {
  return request.post({ url: "/social-client/create", data });
};

// 修改社交客户端
export const updateSocialClient = (data: Partial<SocialClientVO>) => {
  return request.put({ url: "/social-client/update", data });
};

// 删除社交客户端
export const deleteSocialClient = (id: number) => {
  return request.delete({ url: "/social-client/delete", params: { id } });
};

export const deleteSocialClientList = (ids: number[]) => {
  return request.delete({ url: "/social-client/delete-list", params: { ids: ids.join(",") } });
};

export const sendSocialSubscribeMessage = (data: Record<string, any>) => {
  return request.post({ url: "/social-client/send-subscribe-message", data });
};
