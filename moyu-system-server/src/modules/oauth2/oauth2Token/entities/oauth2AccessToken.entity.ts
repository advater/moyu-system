import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * OAuth2 访问令牌实体
 */
export class OAuth2AccessTokenDO extends TenantBaseDO {
  /**
   * OAuth2 访问令牌ID 自增主键
   */
  id: number;
  /**
   * 访问令牌
   */
  accessToken: string;
  /**
   * 刷新令牌
   */
  refreshToken: string;
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
   * 用户信息
   */
  userInfo: Record<string, string>;
  /**
   * 客户端编号
   *
   * 关联 {@link OAuth2ClientDO#getId()}
   */
  clientId: string;
  /**
   * 授权范围
   */
  scopes: string[];
  /**
   * 签发时的用户权限版本快照
   *
   * 与 {@link UserDO#permVersion} 逐请求比对，不一致说明权限已变更，令牌失效。
   */
  permVersion: number;
  /**
   * 过期时间
   */
  expiresTime: Date;
}
