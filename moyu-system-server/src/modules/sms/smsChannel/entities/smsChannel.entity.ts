import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 短信渠道实体
 */
export class SmsChannelDO extends TenantBaseDO {
  /**
   * 短信渠道ID 自增主键
   */
  id: number;
  /**
   * 短信签名
   */
  signature: string;
  /**
   * 渠道编码
   *
   * 枚举 {@link SmsChannelEnum}
   */
  code: string;
  /**
   * 启用状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 备注
   */
  remark: string;
  /**
   * 短信 API 的账号
   */
  apiKey: string;
  /**
   * 短信 API 的密钥
   */
  apiSecret: string;
  /**
   * 短信发送回调 URL
   */
  callbackUrl: string;
}
