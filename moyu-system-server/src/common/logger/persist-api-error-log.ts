import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import { ApiErrorLogService } from '@/modules/logger/apiErrorLog/apiErrorLog.service';
import { sanitizeBody } from '@/utils/sanitize';
import type { LoginUser } from '@/common/decorator/login-user.decorator';

/** 本请求已由日志 AOP 写入报错日志，过滤器勿重复落库 */
export const ERROR_LOG_WRITTEN_KEY = '__errorLogWritten';
export const REQ_STARTED_AT_KEY = '__reqStartedAt';

export type ErrorLogRequest = {
  method?: string;
  url?: string;
  body?: unknown;
  query?: unknown;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  loginUser?: LoginUser;
  user?: LoginUser;
  __traceId?: string;
  [ERROR_LOG_WRITTEN_KEY]?: boolean;
};

export function persistApiErrorLog(
  apiErrorLogService: ApiErrorLogService | undefined,
  request: ErrorLogRequest,
  exception: Error,
): void {
  if (!apiErrorLogService) return;
  if (process.env.API_ERROR_LOG_ENABLED === 'false') return;
  if (request[ERROR_LOG_WRITTEN_KEY]) return;

  request[ERROR_LOG_WRITTEN_KEY] = true;
  const loginUser = request.loginUser ?? request.user;
  const ua = request.headers?.['user-agent'];
  const userAgent = Array.isArray(ua) ? ua[0] : (ua as string) ?? '';
  const stack = exception.stack || '';
  const stackLine = stack.split('\n')[1] || '';
  const tenantId =
    TenantContext.getTenantId() ||
    loginUser?.tenantId ||
    DEFAULT_TENANT_ID;

  void apiErrorLogService.createQuiet({
    tenantId,
    traceId: request.__traceId || null,
    userId: loginUser?.id ?? 0,
    userType: loginUser?.userType ?? 0,
    applicationName: process.env.APPLICATION_NAME || 'moyu-system-server',
    requestMethod: request.method || 'GET',
    requestUrl: (request.url || '').slice(0, 512),
    requestParams: JSON.stringify({
      query: request.query ?? {},
      body: sanitizeBody(
        ((request.body as Record<string, unknown>) || {}) as Record<
          string,
          any
        >,
      ),
    }).slice(0, 8000),
    userIp: request.ip || null,
    userAgent: userAgent.slice(0, 512),
    exceptionTime: new Date(),
    exceptionName: (exception.name || 'Error').slice(0, 128),
    exceptionMessage: (exception.message || '').slice(0, 8000),
    exceptionRootCauseMessage: exception.message || null,
    exceptionStackTrace: stack.slice(0, 16000),
    exceptionClassName: exception.name || null,
    exceptionFileName: stackLine.slice(0, 256) || null,
    exceptionMethodName: null,
    exceptionLineNumber: null,
    processStatus: 0,
  });
}

export function asError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(typeof err === 'string' ? err : 'Unknown error');
}

export function httpStatusOf(err: unknown): number {
  if (
    err &&
    typeof err === 'object' &&
    'getStatus' in err &&
    typeof (err as { getStatus: () => unknown }).getStatus === 'function'
  ) {
    const status = (err as { getStatus: () => number }).getStatus();
    if (typeof status === 'number' && Number.isFinite(status)) return status;
  }
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    typeof (err).status === 'number'
  ) {
    return (err as { status: number }).status;
  }
  return 500;
}
