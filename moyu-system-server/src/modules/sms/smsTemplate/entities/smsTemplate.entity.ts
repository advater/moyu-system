import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 短信模板实体
 */
export class SmsTemplateDO extends TenantBaseDO {
  /**
   * 短信模板ID 自增主键
   */
  id: number;

  // ========= 模板相关字段 =========

  /**
   * 短信类型
   *
   * 枚举 {@link SmsTemplateTypeEnum}
   */
  type: number;
  /**
   * 启用状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  /**
   * 模板编码，保证唯一
   */
  code: string;
  /**
   * 模板名称
   */
  name: string;
  /**
   * 模板内容
   *
   * 内容的参数，使用 {} 包括，例如说 {name}
   */
  content: string;
  /**
   * 参数数组(自动根据内容生成)
   */
  params: string[];
  /**
   * 备注
   */
  remark: string;
  /**
   * 短信 API 的模板编号
   */
  apiTemplateId: string;

  // ========= 渠道相关字段 =========
  /**
   * 短信渠道编号
   *
   * 关联 {@link SmsChannelDO#getId()}
   */
  channelId: number;
  /**
   * 短信渠道编码
   *
   * 冗余 {@link SmsChannelDO#getCode()}
   */
  channelCode: string;
}
