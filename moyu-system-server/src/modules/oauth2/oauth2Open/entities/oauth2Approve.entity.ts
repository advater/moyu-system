import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * OAuth2 批准实体
 *
 * 用户在 sso 界面时，记录接受的 scope 列表
 */
export class OAuth2ApproveDO extends TenantBaseDO {
  /**
   * OAuth2 批准ID 自增主键
   */
  id: number;
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
   * 授权范围
   */
  scope: string;
  /**
   * 是否接受
   *
   * true - 接受
   * false - 拒绝
   */
  approved: boolean;
  /**
   * 过期时间
   */
  expiresTime: Date;
}
