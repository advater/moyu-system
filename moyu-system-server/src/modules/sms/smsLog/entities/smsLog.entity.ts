import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 短信日志实体
 */
export class SmsLogDO extends TenantBaseDO {
  /**
   * 短信日志ID 自增主键
   */
  id: number;

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

  // ========= 模板相关字段 =========
  /**
   * 模板编号
   *
   * 关联 {@link SmsTemplateDO#getId()}
   */
  templateId: number;
  /**
   * 模板编码
   *
   * 冗余 {@link SmsTemplateDO#getCode()}
   */
  templateCode: string;
  /**
   * 短信类型
   *
   * 冗余 {@link SmsTemplateDO#getType()}
   */
  templateType: number;
  /**
   * 基于 {@link SmsTemplateDO#getContent()} 格式化后的内容
   */
  templateContent: string;
  /**
   * 基于 {@link SmsTemplateDO#getParams()} 输入后的参数
   */
  templateParams: Record<string, any>;
  /**
   * 短信 API 的模板编号
   *
   * 冗余 {@link SmsTemplateDO#getApiTemplateId()}
   */
  apiTemplateId: string;

  // ========= 手机相关字段 =========
  /**
   * 手机号
   */
  mobile: string;
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

  // ========= 发送相关字段 =========
  /**
   * 发送状态
   *
   * 枚举 {@link SmsSendStatusEnum}
   */
  sendStatus: number;
  /**
   * 发送时间
   */
  sendTime: Date;
  /**
   * 短信 API 发送结果的编码
   *
   * 由于第三方的错误码可能是字符串，所以使用 String 类型
   */
  apiSendCode: string;
  /**
   * 短信 API 发送失败的提示
   */
  apiSendMsg: string;
  /**
   * 短信 API 发送返回的唯一请求 ID
   *
   * 用于和短信 API 进行定位于排错
   */
  apiRequestId: string;
  /**
   * 短信 API 发送返回的序号
   *
   * 用于和短信 API 平台的发送记录关联
   */
  apiSerialNo: string;

  // ========= 接收相关字段 =========
  /**
   * 接收状态
   *
   * 枚举 {@link SmsReceiveStatusEnum}
   */
  receiveStatus: number;
  /**
   * 接收时间
   */
  receiveTime: Date;
  /**
   * 短信 API 接收结果的编码
   */
  apiReceiveCode: string;
  /**
   * 短信 API 接收结果的提示
   */
  apiReceiveMsg: string;
}
