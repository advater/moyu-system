/**
 * HTTP 异常详情构建工具
 */
import { HttpException, HttpStatus } from '@nestjs/common';

/** HTTP 状态码对应的默认错误描述 */
const STATUS_ERROR_MAP: Record<number, string> = {
  400: '请求参数错误',
  404: '资源不存在',
  409: '资源冲突',
};

/**
 * 从 HttpException 中提取统一的错误详情
 * - 处理 string / object 两种 getResponse() 返回
 * - 为 400 / 401 补充默认中文提示
 */
export function buildHttpErrorDetails(
  exception: HttpException,
  status: number,
): Record<string, any> {
  let response = exception.getResponse() as Record<string, string>;

  if (typeof response === 'string') {
    response = {
      message: response,
      error: STATUS_ERROR_MAP[status] || 'UNKNOWN_ERROR',
    };
  }

  if (status === 400 && !response.message) {
    response.message = '请求参数错误';
  }
  if (status === 401 && !response.message) {
    response.message = '未授权，请登录';
  }

  return {
    ...response,
    error: response.error || HttpStatus[status],
  };
}