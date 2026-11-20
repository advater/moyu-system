import { request } from "@/utils/request";
import type { ProfileVO, UserProfileUpdateReqVO, UserVO } from "./types";
export type { ProfileVO, UserProfileUpdateReqVO };

// 查询用户个人信息
export const getUserProfile = () => {
  return request.get<ProfileVO>({ url: "/user-profile/get" });
};

// 修改用户个人信息
export const updateUserProfile = (data: UserProfileUpdateReqVO) => {
  return request.put({ url: "/user-profile/update", data });
};

// 用户密码重置
export const updateUserPassword = (oldPassword: string, newPassword: string) => {
  return request.put({
    url: "/user-profile/update-password",
    data: { oldPassword, newPassword },
  });
};

export const updateUserProfilePassword = (data: {
  oldPassword: string;
  newPassword: string;
}) => updateUserPassword(data.oldPassword, data.newPassword);

/** 兼容布局/登录：补齐 tenant_id 字段 */
export const getCurrentUserInfo = async () => {
  const data: any = await getUserProfile();
  if (data && data.tenantId != null && data.tenant_id == null) {
    data.tenant_id = data.tenantId;
  }
  return data as ProfileVO & UserVO;
};

export const getUserInfo = (data: { id?: number }) =>
  data?.id ? request.get({ url: "/user/get", params: { id: data.id } }) : getUserProfile();

export const updateUserProfileAvatar = (file: File) => {
  const data = new FormData();
  data.append("file", file);
  return request.upload<string>({ url: "/user-profile/update-avatar", data });
};
