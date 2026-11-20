import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * OAuth2 授权码实体
 */
export class OAuth2CodeDO extends TenantBaseDO {
  /**
   * OAuth2 授权码ID 自增主键
   */
  id: number;
  /**
   * 授权码
   */
  code: string;
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
   * 客户端编号
   *
   * 关联 {@link OAuth2ClientDO#getClientId()}
   */
  clientId: string;
  /**
   * 授权范围
   */
  scopes: string[];
  /**
   * 重定向地址
   */
  redirectUri: string;
  /**
   * 状态
   */
  state: string;
  /**
   * 过期时间
   */
  expiresTime: Date;
}
