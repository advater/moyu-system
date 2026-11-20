/**
 * 全局异常过滤器 — 兜底捕获所有未处理异常
 *
 * HTTP 错误响应与成功响应对齐：{ code, data, message }
 * （另附 path / timestamp / error 便于排查，前端以 code/message 为准）
 * 若业务错误以 i18n key 抛出（如 AUTH.INVALID_TOKEN），额外透出 errorCode 供前端分支处理
 */
import {
  Catch,
  HttpException,
  HttpStatus,
  ExceptionFilter,
  ArgumentsHost,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '@/plugins/logger/logger.service';
import { sanitizeBody } from '@/utils/sanitize';
import { buildHttpErrorDetails } from '@/utils/http-error';
import { ApiErrorLogService } from '@/modules/logger/apiErrorLog/apiErrorLog.service';
import { ErrorCodeService } from '@/modules/errorCode/errorCode.service';
import { CommonError } from '@/config/error-messages';
import { I18nService } from '@/i18n';
import type { LoginUser } from '@/common/decorator/login-user.decorator';
import {
  asError,
  persistApiErrorLog,
  type ErrorLogRequest,
} from '@/common/logger/persist-api-error-log';

/**
 * 业务错误码（i18n key）形态：AUTH.INVALID_TOKEN / OP_LOG.SUB.XXX
 * 普通文案（中文、校验提示）不会命中，避免污染响应体
 */
const BIZ_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)+$/;

@Catch()
export class CatchExceptionFilter<T = unknown> implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    @Optional() private readonly apiErrorLogService?: ApiErrorLogService,
    @Optional() private readonly errorCodeService?: ErrorCodeService,
    @Optional() private readonly i18n?: I18nService,
  ) {}

  async catch(exception: T, host: ArgumentsHost) {
    const protocol = host.getType();
    if (protocol === 'http') {
      await this.handleHttpException(exception, host);
    } else if (protocol === 'rpc') {
      return this.handleRpcException(exception, host);
    } else if (protocol === 'ws') {
      return this.handleWsException(exception, host);
    }
  }

  private async handleHttpException(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { loginUser?: LoginUser; user?: LoginUser; __traceId?: string }
    >();

    const isHttpException = exception instanceof HttpException;
    if (!isHttpException) {
      this.logger.error({
        name: 'UnknownException',
        message: (exception as Error).message || 'Unknown error',
        stack: (exception as Error).stack || '',
        request: {
          method: request.method,
          path: request.url,
          body: sanitizeBody(
            ((request.body as Record<string, unknown>) || {}) as Record<
              string,
              any
            >,
          ),
          params: request.params,
          query: request.query,
        },
        timestamp: new Date().toISOString(),
      });
      persistApiErrorLog(
        this.apiErrorLogService,
        request as ErrorLogRequest,
        asError(exception),
      );
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: this.tx(CommonError.INTERNAL_ERROR),
        path: request.url,
        timestamp: new Date().toISOString(),
        error: 'INTERNAL_SERVER_ERROR',
      });
      return;
    }

    this.logException(exception, request);
    const statusCode = exception.getStatus();
    if (statusCode >= 500) {
      persistApiErrorLog(
        this.apiErrorLogService,
        request as ErrorLogRequest,
        asError(exception),
      );
    }
    const details = buildHttpErrorDetails(exception, statusCode);
    let message =
      typeof details.message === 'string'
        ? details.message
        : Array.isArray(details.message)
          ? details.message.map((m) => String(m)).join('; ')
          : exception.message || CommonError.REQUEST_FAILED;

    // 业务错误码运营文案覆盖（按 HTTP status 或 response.body.code）
    const body = exception.getResponse();
    const bizCode =
      body && typeof body === 'object' && 'code' in body
        ? Number((body as { code?: unknown }).code)
        : statusCode;
    if (this.errorCodeService && Number.isFinite(bizCode)) {
      try {
        const override = await this.errorCodeService.getMessageByCode(bizCode);
        if (override) message = override;
      } catch {
        // ignore lookup failures
      }
    }

    // 翻译前提取业务错误码（message 为 i18n key 时），供前端按码精准提示
    const errorCode = BIZ_ERROR_CODE_PATTERN.test(message) ? message : undefined;

    message = this.tx(message);

    response.status(statusCode).send({
      code: statusCode,
      data: null,
      message,
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: details.error,
    });
  }

  private tx(raw: string): string {
    if (!this.i18n) return raw;
    // class-validator 多字段错误常以 "; " 拼接
    if (raw.includes('; ')) {
      return raw
        .split('; ')
        .map((part) => this.i18n!.translateMessage(part.trim()))
        .join('; ');
    }
    return this.i18n.translateMessage(raw);
  }

  private handleRpcException(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const data: unknown = ctx.getData();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.tx(
      isHttpException
        ? (exception as HttpException).message
        : (exception as Error).message || CommonError.INTERNAL_ERROR,
    );
    this.logger.error({
      name: 'RpcException',
      message,
      data,
      timestamp: new Date().toISOString(),
    });
    return { code: status, data: null, message };
  }

  private handleWsException(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<{
      emit?: (event: string, payload: { code: number; message: string }) => void;
    }>();
    const data: unknown = ctx.getData();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.tx(
      isHttpException
        ? (exception as HttpException).message
        : (exception as Error).message || CommonError.INTERNAL_ERROR,
    );
    this.logger.error({
      name: 'WsException',
      message,
      data,
      timestamp: new Date().toISOString(),
    });
    client.emit?.('exception', { code: status, message });
  }

  private logException(exception: HttpException, request: Request) {
    const status = exception.getStatus();
    const payload = {
      name: exception.name || '',
      message: exception.message || '',
      request: {
        method: request.method,
        path: request.url,
        query: request.query,
      },
      timestamp: new Date().toISOString(),
    };
    // 401/403 是登录态过期或未登录，未读轮询等会反复打到，不要当系统异常刷 ERROR
    const quietStatuses: number[] = [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ];
    if (quietStatuses.includes(status)) {
      this.logger.warn(payload);
      return;
    }
    if (status >= 500) {
      this.logger.error({
        ...payload,
        stack: exception.stack || '',
        body: sanitizeBody(request.body as Record<string, any>),
        params: request.params,
      });
      return;
    }
    this.logger.warn({
      ...payload,
      body: sanitizeBody(request.body as Record<string, any>),
      params: request.params,
    });
  }
}
