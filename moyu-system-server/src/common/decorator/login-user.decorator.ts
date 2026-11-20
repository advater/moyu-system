import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前登录用户信息（由 JwtGuard 校验令牌后挂载到 request.loginUser）
 */
export interface LoginUser {
  /** 用户编号 */
  id: number;
  /** 用户类型（1-管理后台用户；2-会员用户） */
  userType: number;
  /** 租户编号 */
  tenantId: string;
  /** 客户端编号 */
  clientId: string;
  /** 授权范围 */
  scopes?: string[];
  /** 当前请求携带的访问令牌 */
  accessToken?: string;
  /** 登录时快照的用户信息（nickname/avatar 等） */
  userInfo?: Record<string, string>;
  /** 角色编码列表（鉴权时按需加载） */
  roles?: string[];
  /** 权限标识列表（鉴权时按需加载） */
  permissions?: string[];
}

/**
 * 获取当前登录用户参数装饰器
 *
 * 用法：在 Controller 方法参数上声明
 *   getUser(@LoginUser() user: LoginUser) { ... }
 */
export const LoginUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LoginUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.loginUser;
  },
);
