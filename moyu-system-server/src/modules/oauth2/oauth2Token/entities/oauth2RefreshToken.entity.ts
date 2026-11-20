import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * OAuth2 刷新令牌
 */
export class OAuth2RefreshTokenDO extends TenantBaseDO {
  /**
   * OAuth2 刷新令牌ID 自增主键
   */
  id: number;
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
   * 客户端编号
   *
   * 关联 {@link OAuth2ClientDO#getId()}
   */
  clientId: string;
  /**
   * 刷新令牌家族编号
   *
   * 同一登录会话的轮换链共用；重放侦测命中时整族吊销。
   */
  familyId: string;
  /**
   * 授权范围
   */
  scopes: string[];
  /**
   * 过期时间
   */
  expiresTime: Date;
  /**
   * 软删时间（轮换 / 撤销时间）
   *
   * 供重放侦测判断并发宽限期；正常查询结果恒为 null。
   */
  deletedAt?: Date | null;
}
