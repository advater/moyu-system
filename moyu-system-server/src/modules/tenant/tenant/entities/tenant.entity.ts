import { BaseDO } from '@/types/base.do';

/**
 * 租户实体
 */
export class TenantDO extends BaseDO {
  /**
   * 租户ID 自增主键
   */
  id: number;
  /**
   * 租户名，唯一
   */
  name: string;
  /**
   * 联系人的用户编号
   *
   * 关联 {@link UserDO#getId()}
   */
  contactUserId: number;
  /**
   * 联系人
   */
  contactName: string;
  /**
   * 联系手机
   */
  contactMobile: string;
  /**
   * 租户状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 绑定域名列表
   *
   * 1. 考虑到对微信小程序的兼容，也允许传递 appid
   * 2. 为什么是数组，考虑到管理后台、会员前台都有独立的域名，又或者多个管理后台
   */
  websites: string[];
  /**
   * 租户套餐编号
   *
   * 关联 {@link TenantPackageDO#getId()}
   * 特殊逻辑：系统内置租户，不使用套餐，暂时使用 {@link #PACKAGE_ID_SYSTEM} 标识
   */
  packageId: number;
  /**
   * 过期时间
   */
  expireTime: Date;
  /**
   * 账号数量
   */
  accountCount: number;
}
