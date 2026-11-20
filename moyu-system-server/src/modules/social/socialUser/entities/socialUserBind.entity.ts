import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 社交用户的绑定实体
 * 即 {@link SocialUserDO} 与 UserDO 的关联表
 */
export class SocialUserBindDO extends TenantBaseDO {
  /**
   * 社交用户的绑定ID 自增主键
   */
  id: number;
  /**
   * 关联的用户编号
   *
   * 关联 UserDO 的编号
   */
  userId: number;
  /**
   * 用户类型
   *
   * 枚举 {@link UserTypeEnum}
   */
  userType: number;

  /**
   * 社交平台的用户编号
   *
   * 关联 {@link SocialUserDO#getId()}
   */
  socialUserId: number;
  /**
   * 社交平台的类型
   *
   * 冗余 {@link SocialUserDO#getType()}
   */
  socialType: number;
}
