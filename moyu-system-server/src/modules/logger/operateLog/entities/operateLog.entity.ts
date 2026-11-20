import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 操作日志表
 */
export class OperateLogDO extends TenantBaseDO {
  /**
   * 操作日志ID 自增主键
   */
  id: number;
  /**
   * 链路追踪编号
   *
   * 一般来说，通过链路追踪编号，可以将访问日志，错误日志，链路追踪日志，logger 打印日志等，结合在一起，从而进行排错。
   */
  traceId: string;
  /**
   * 用户编号
   *
   * 关联 MemberUserDO 的 id 属性，或者 UserDO 的 id 属性
   */
  userId: number;
  /**
   * 用户类型
   *
   * 关联 {@link  UserTypeEnum}
   */
  userType: number;
  /**
   * 操作模块类型
   */
  type: string;
  /**
   * 操作名
   */
  subType: string;
  /**
   * 操作模块业务编号
   */
  bizId: number;
  /**
   * 日志内容，记录整个操作的明细
   *
   * 例如说，修改编号为 1 的用户信息，将性别从男改成女，将姓名从moyu改成avatar。
   */
  action: string;
  /**
   * 拓展字段，有些复杂的业务，需要记录一些字段 ( JSON 格式 )
   *
   * 例如说，记录订单编号，{ orderId: "1"}
   */
  extra: string;

  /**
   * 请求方法名
   */
  requestMethod: string;
  /**
   * 请求地址
   */
  requestUrl: string;
  /**
   * 用户 IP
   */
  userIp: string;
  /**
   * 浏览器 UA
   */
  userAgent: string;
}
