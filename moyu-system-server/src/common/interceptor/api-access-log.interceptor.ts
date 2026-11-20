import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { ApiAccessLogService } from '@/modules/logger/apiAccessLog/apiAccessLog.service';
import { ApiErrorLogService } from '@/modules/logger/apiErrorLog/apiErrorLog.service';
import { sanitizeBody } from '@/utils/sanitize';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import type { LoginUser } from '@/common/decorator/login-user.decorator';
import {
  asError,
  httpStatusOf,
  persistApiErrorLog,
  REQ_STARTED_AT_KEY,
} from '@/common/logger/persist-api-error-log';

const SKIP_PREFIXES = ['/health', '/api-docs', '/favicon'];

function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

type AccessRequest = {
  method?: string;
  url?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  loginUser?: LoginUser;
  user?: LoginUser;
  __traceId?: string;
  [REQ_STARTED_AT_KEY]?: number;
};

/**
 * 日志 AOP
 * - 访问日志（含调用耗时）
 * - 5xx 报错日志落库（过滤器仅兜底守卫等拦截器看不到的异常）
 */
@Injectable()
export class ApiAccessLogInterceptor implements NestInterceptor {
  constructor(
    private readonly accessLogService: ApiAccessLogService,
    @Optional() private readonly errorLogService?: ApiErrorLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<AccessRequest>();
    const url = request.url || '';
    if (SKIP_PREFIXES.some((p) => url.startsWith(p))) {
      return next.handle();
    }

    const beginTime = new Date(
      request[REQ_STARTED_AT_KEY] ?? Date.now(),
    );
    const traceId = request.__traceId || randomUUID();
    request.__traceId = traceId;
    const accessEnabled = process.env.API_ACCESS_LOG_ENABLED !== 'false';

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (accessEnabled) {
            void this.writeAccess(request, beginTime, traceId, 0, data);
          }
        },
        error: (err: unknown) => {
          const code = httpStatusOf(err);
          if (accessEnabled) {
            void this.writeAccess(
              request,
              beginTime,
              traceId,
              code,
              null,
              asError(err).message,
            );
          }
          if (code >= 500) {
            persistApiErrorLog(this.errorLogService, request, asError(err));
          }
        },
      }),
    );
  }

  private async writeAccess(
    request: AccessRequest,
    beginTime: Date,
    traceId: string,
    resultCode: number,
    data: unknown,
    resultMsg?: string,
  ): Promise<void> {
    const endTime = new Date();
    const loginUser = request.loginUser ?? request.user;
    const ua = request.headers?.['user-agent'];
    const userAgent = Array.isArray(ua) ? ua[0] : ua ?? '';
    const params = trunc(
      JSON.stringify({
        query: request.query ?? {},
        body: sanitizeBody(request.body ?? {}),
      }),
      8000,
    );
    let responseBody: string | null = null;
    if (data !== null && data !== undefined && process.env.API_ACCESS_LOG_BODY === 'true') {
      try {
        responseBody = trunc(JSON.stringify(data), 8000);
      } catch {
        responseBody = null;
      }
    }

    const tenantId =
      TenantContext.getTenantId() ||
      loginUser?.tenantId ||
      DEFAULT_TENANT_ID;

    await this.accessLogService.createQuiet({
      tenantId,
      traceId,
      userId: loginUser?.id ?? 0,
      userType: loginUser?.userType ?? 0,
      applicationName:
        process.env.APPLICATION_NAME || 'moyu-system-server',
      requestMethod: request.method || 'GET',
      requestUrl: trunc(request.url || '', 512),
      requestParams: params,
      responseBody,
      userIp: request.ip || null,
      userAgent: trunc(userAgent, 512),
      operateModule: null,
      operateName: null,
      operateType: 0,
      beginTime,
      endTime,
      duration: endTime.getTime() - beginTime.getTime(),
      resultCode,
      resultMsg: resultMsg ? trunc(resultMsg, 512) : null,
    });
  }
}
