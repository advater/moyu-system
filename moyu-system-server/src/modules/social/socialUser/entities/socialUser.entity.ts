import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 社交（三方）用户实体
 */
export class SocialUserDO extends TenantBaseDO {
  /**
   * 社交（三方）用户ID 自增主键
   */
  id: number;
  /**
   * 社交平台的类型
   *
   * 枚举 {@link SocialTypeEnum}
   */
  type: number;

  /**
   * 社交 openid
   */
  openid: string;
  /**
   * 社交 token
   */
  token: string;
  /**
   * 原始 Token 数据，一般是 JSON 格式
   */
  rawTokenInfo: string;

  /**
   * 用户昵称
   */
  nickname: string;
  /**
   * 用户头像
   */
  avatar: string;
  /**
   * 原始用户数据，一般是 JSON 格式
   */
  rawUserInfo: string;

  /**
   * 最后一次的认证 code
   */
  code: string;
  /**
   * 最后一次的认证 state
   */
  state: string;
}
