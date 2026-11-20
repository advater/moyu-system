import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 站内信实体
 */
export class NotifyMessageDO extends TenantBaseDO {
  /**
   * 站内信ID 自增主键
   */
  id: number;
  /**
   * 用户编号
   *
   * 关联 MemberUserDO 的 id 字段、或者 UserDO 的 id 字段
   */
  userId: number;
  /**
   * 用户类型
   *
   * 枚举 {@link UserTypeEnum}
   */
  userType: number;

  // ========= 模板相关字段 =========

  /**
   * 模版编号
   *
   * 关联 {@link NotifyTemplateDO#getId()}
   */
  templateId: number;
  /**
   * 模版编码
   *
   * 关联 {@link NotifyTemplateDO#getCode()}
   */
  templateCode: string;
  /**
   * 模版类型
   *
   * 冗余 {@link NotifyTemplateDO#getType()}
   */
  templateType: number;
  /**
   * 模版发送人名称
   *
   * 冗余 {@link NotifyTemplateDO#getNickname()}
   */
  templateNickname: string;
  /**
   * 模版内容
   *
   * 基于 {@link NotifyTemplateDO#getContent()} 格式化后的内容
   */
  templateContent: string;
  /**
   * 模版参数
   *
   * 基于 {@link NotifyTemplateDO#getParams()} 输入后的参数
   */
  templateParams: Record<string, any>;

  // ========= 读取相关字段 =========
  /**
   * 是否已读
   */
  readStatus: boolean;
  /**
   * 阅读时间
   */
  readTime: Date | null;
}
