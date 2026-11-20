import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 登录日志表
 * 注意，包括登录和登出两种行为
 */
export class LoginLogDO extends TenantBaseDO {
  /**
   * 登录日志ID 自增主键
   */
  id: number;
  /**
   * 日志类型
   *
   * 枚举 {@link LoginLogTypeEnum}
   */
  logType: number;
  /**
   * 链路追踪编号
   */
  traceId: string;
  /**
   * 用户编号
   */
  userId: number;
  /**
   * 用户类型
   *
   * 枚举 {@link UserTypeEnum}
   */
  userType: number;
  /**
   * 用户账号
   *
   * 冗余，因为账号可以变更
   */
  username: string;
  /**
   * 登录结果
   *
   * 枚举 {@link LoginResultEnum}
   */
  result: number;
  /**
   * 用户 IP
   */
  userIp: string;
  /**
   * IP 归属地
   */
  location?: string | null;
  /**
   * 浏览器 UA
   */
  userAgent: string;
  /**
   * 失败原因（业务错误码，如 AUTH.PASSWORD_MISMATCH；成功时为空）
   */
  failReason?: string | null;
}
