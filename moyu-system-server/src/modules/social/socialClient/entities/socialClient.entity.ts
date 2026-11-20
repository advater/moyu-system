import { TenantBaseDO } from '@/types/tenantBase.do';
/**
 * 社交客户端实体
 *
 * 对应 {@link AuthConfig} 配置，满足不同租户，有自己的客户端配置，实现社交（三方）登录
 */
export class SocialClientDO extends TenantBaseDO {
  /**
   * 社交客户端ID 自增主键
   */
  id: number;
  /**
   * 应用名
   */
  name: string;
  /**
   * 社交类型
   *
   * 枚举 {@link SocialTypeEnum}
   */
  socialType: number;
  /**
   * 用户类型
   *
   * 目的：不同用户类型，对应不同的小程序，需要自己的配置
   *
   * 枚举 {@link UserTypeEnum}
   */
  userType: number;
  /**
   * 状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;

  /**
   * 客户端 id
   */
  clientId: string;
  /**
   * 客户端 Secret
   */
  clientSecret: string;

  /**
   * 代理编号
   *
   * 目前只有部分“社交类型”在使用：
   * 1. 企业微信：对应授权方的网页应用 ID
   */
  agentId: string;

  /**
   * publicKey 公钥
   *
   * 目前只有部分“社交类型”在使用：
   * 1. 支付宝：支付宝公钥
   */
  publicKey: string;
}
