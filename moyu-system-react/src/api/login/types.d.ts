export type UserLoginVO = {
  username: string;
  password: string;
  tenantName?: string;
  captchaVerification?: string;
  captchaUuid?: string;
  captchaCode?: string;
  rememberMe?: boolean;
  socialType?: string;
  socialCode?: string;
  socialState?: string;
  /** 兼容旧表单字段 */
  account?: string;
  code?: string;
};

export type TokenType = {
  id?: number;
  accessToken: string;
  refreshToken: string;
  userId: number;
  userType?: number;
  clientId?: string;
  expiresTime?: number | string;
  mustChangePassword?: boolean;
};

export type UserVO = {
  id: number;
  username: string;
  nickname: string;
  deptId?: number;
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  loginIp?: string;
  loginDate?: string;
};

export type RegisterVO = {
  tenantName?: string;
  username?: string;
  nickname?: string;
  password: string;
  captchaVerification?: string;
  account?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  captchaUuid?: string;
  captchaCode?: string;
  rePassword?: string;
  confirmPassword?: string;
};

/** 兼容旧登录页类型名 */
export type ILoginData = UserLoginVO;
export type ILoginResult = TokenType;
export type IRegisterData = RegisterVO;
export interface IPasswordData {
  oldPassword?: string;
  newPassword?: string;
  account?: string;
  password?: string;
  rePassword?: string;
}

export interface SmsCodeVO {
  mobile: string;
  scene: number;
  captchaUuid?: string;
  captchaCode?: string;
  tenantId?: string;
  tenantName?: string;
}

export interface SmsLoginVO {
  mobile: string;
  code: string;
}

export interface PermissionInfo {
  user?: any;
  roles?: string[];
  permissions?: string[];
  menus?: any[];
}
