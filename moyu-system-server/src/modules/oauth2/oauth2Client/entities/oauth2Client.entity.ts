import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * OAuth2 客户端实体
 */
export class OAuth2ClientDO extends TenantBaseDO {
  /**
   * OAuth2 客户端ID 自增主键
   *
   * 由于 SQL Server 在存储 String 主键有点问题，所以暂时使用 Long 类型
   */
  id: number;
  /**
   * 客户端编号
   */
  clientId: string;
  /**
   * 客户端密钥
   */
  secret: string;
  /**
   * 应用名
   */
  name: string;
  /**
   * 应用图标
   */
  logo: string;
  /**
   * 应用描述
   */
  description: string;
  /**
   * 状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 访问令牌的有效期
   */
  accessTokenValiditySeconds: number;
  /**
   * 刷新令牌的有效期
   */
  refreshTokenValiditySeconds: number;
  /**
   * 可重定向的 URI 地址
   */
  redirectUris: string[];
  /**
   * 授权类型（模式）
   *
   * 枚举 {@link OAuth2GrantTypeEnum}
   */
  authorizedGrantTypes: string[];
  /**
   * 授权范围
   */
  scopes: string[];
  /**
   * 自动授权的 Scope
   *
   * code 授权时，如果 scope 在这个范围内，则自动通过
   */
  autoApproveScopes: string[];
  /**
   * 权限
   */
  authorities: string[];
  /**
   * 资源
   */
  resourceIds: string[];
  /**
   * 附加信息，JSON 格式
   */
  additionalInformation: string;
}
