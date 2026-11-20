import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { OPERATE_LOG_KEY } from '@/config/constants';

export interface OperateLogMeta {
  /** 操作模块，如「用户管理」 */
  type: string;
  /** 操作名，如「创建用户」 */
  subType: string;
  /** 从返回值或请求中解析业务编号的字段名，默认 id */
  bizIdKey?: string;
}

/**
 * 标记需要自动写入操作日志的接口（配合 OperateLogInterceptor）
 *
 * @example
 * @OperateLog({ type: '用户管理', subType: '创建用户' })
 */
export const OperateLog = (
  meta: OperateLogMeta,
): CustomDecorator<string> => {
  return SetMetadata(OPERATE_LOG_KEY, meta);
};
