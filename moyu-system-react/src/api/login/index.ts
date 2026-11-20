import { request } from "@/utils/request";
import type {
  IPasswordData,
  PermissionInfo,
  RegisterVO,
  SmsCodeVO,
  SmsLoginVO,
  TokenType,
  UserLoginVO,
} from "./types";

// 登录
export const login = (data: UserLoginVO) => {
  return request.post<TokenType>({
    url: "/auth/login",
    data: {
      username: data.username || data.account,
      password: data.password,
      tenantName: data.tenantName,
      captchaUuid: data.captchaUuid,
      captchaCode: data.captchaCode || data.code,
      captchaVerification: data.captchaVerification,
      rememberMe: data.rememberMe,
    },
  });
};

// 注册
export const register = (data: RegisterVO) => {
  return request.post<TokenType>({
    url: "/auth/register",
    data: {
      username: data.username || data.account,
      nickname: data.nickname || data.account,
      password: data.password,
      tenantName: data.tenantName,
      email: data.email,
      mobile: data.phone || data.mobile,
      captchaUuid: data.captchaUuid,
      captchaCode: data.captchaCode,
    },
  });
};

// 使用租户名，获得租户编号
export const getTenantIdByName = (name: string) => {
  return request.get<number>({ url: "/tenant/get-id-by-name", params: { name } });
};

// 使用租户域名，获得租户信息
export const getTenantByWebsite = (website: string) => {
  return request.get<{ id: number; name: string }>({
    url: "/tenant/get-by-website",
    params: { website },
  });
};

// 登出
export const loginOut = () => {
  return request.post<boolean>({ url: "/auth/logout" });
};

// 获取用户权限信息
export const getInfo = () => {
  return request.get<PermissionInfo>({ url: "/auth/get-permission-info" });
};

export const getPermissionInfo = getInfo;
export const getUserMenuTree = getInfo;

// 获取登录验证码
export const sendSmsCode = (data: SmsCodeVO) => {
  return request.post({ url: "/auth/send-sms-code", data });
};

// 短信验证码登录
export const smsLogin = (data: SmsLoginVO) => {
  return request.post({ url: "/auth/sms-login", data });
};

// 社交快捷登录，使用 code 授权码
export function socialLogin(type: string, code: string, state: string) {
  return request.post({
    url: "/auth/social-login",
    data: { type, code, state },
  });
}

// 社交授权的跳转
export const socialAuthRedirect = (type: number, redirectUri: string) => {
  return request.get({
    url: "/auth/social-auth-redirect",
    params: { type, redirectUri },
  });
};

// 通过短信重置密码
export const SMS_SCENE_LOGIN = 1;
export const SMS_SCENE_RESET_PASSWORD = 3;

export const smsResetPassword = (data: {
  mobile: string;
  code: string;
  password: string;
  captchaUuid?: string;
  captchaCode?: string;
  tenantName?: string;
}) => {
  return request.post({ url: "/auth/reset-password", data });
};

export const getCaptcha = () => {
  return request.get<{ uuid: string; image: string }>({ url: "/captcha/get" });
};

export const checkCaptcha = (data: Record<string, any>) => {
  return request.post({ url: "/captcha/check", data });
};

/** 登录前改密（兼容旧页）；个人中心改密走 user/profile */
export const postPassword = (data: IPasswordData) => {
  return request.put({
    url: "/user-profile/update-password",
    data: {
      oldPassword: data.oldPassword || data.password,
      newPassword: data.newPassword || data.rePassword || data.password,
    },
  });
};

export const postLogin = login;
export const postRegister = register;
export const deleteLogout = loginOut;

export type {
  ILoginData,
  ILoginResult,
  IPasswordData,
  IRegisterData,
  PermissionInfo,
  RegisterVO,
  SmsCodeVO,
  SmsLoginVO,
  TokenType,
  UserLoginVO,
  UserVO,
} from "./types";
