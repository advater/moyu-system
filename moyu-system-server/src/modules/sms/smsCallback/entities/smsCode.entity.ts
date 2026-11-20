import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 手机授权码实体
 */
export class SmsCodeDO extends TenantBaseDO {
  /**
   * 手机授权码ID 自增主键
   */
  id: number;
  /**
   * 手机号
   */
  mobile: string;
  /**
   * 授权码
   */
  code: string;
  /**
   * 发送场景
   *
   * 枚举 {@link SmsCodeDO}
   */
  scene: number;
  /**
   * 创建 IP
   */
  createIp: string;
  /**
   * 今日发送的第几条
   */
  todayIndex: number;
  /**
   * 是否使用
   */
  used: boolean;
  /**
   * 使用时间
   */
  usedTime: Date;
  /**
   * 使用 IP
   */
  usedIp: string;
}
