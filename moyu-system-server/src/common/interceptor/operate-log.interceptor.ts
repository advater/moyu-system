import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { OPERATE_LOG_KEY, USER_TYPE_ADMIN } from '@/config/constants';
import type { OperateLogMeta } from '@/common/decorator/operate-log.decorator';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { sanitizeBody } from '@/utils/sanitize';
import { randomUUID } from 'node:crypto';
import type { LoginUser } from '@/common/decorator/login-user.decorator';

/**
 * 操作日志拦截器 — 对标注 @OperateLog 的成功请求异步落库
 */
@Injectable()
export class OperateLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperateLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly operateLogService: OperateLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<OperateLogMeta>(
      OPERATE_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!meta || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.writeLog(meta, request, data, start);
        },
      }),
    );
  }

  private async writeLog(
    meta: OperateLogMeta,
    request: {
      method?: string;
      url?: string;
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      headers?: Record<string, string | string[] | undefined>;
      ip?: string;
      loginUser?: LoginUser;
      user?: LoginUser;
    },
    data: unknown,
    start: number,
  ): Promise<void> {
    try {
      const loginUser = request.loginUser ?? request.user;
      if (!loginUser?.id) return;

      const bizIdKey = meta.bizIdKey ?? 'id';
      let bizId = 0;
      if (typeof data === 'number' && Number.isFinite(data)) {
        bizId = data;
      } else if (data && typeof data === 'object') {
        const raw = (data as Record<string, unknown>)[bizIdKey];
        if (typeof raw === 'number') bizId = raw;
        else if (typeof raw === 'string' && raw) bizId = Number(raw) || 0;
      }
      if (!bizId && request.body && typeof request.body[bizIdKey] !== 'undefined') {
        bizId = Number(request.body[bizIdKey]) || 0;
      }

      const safeBody = sanitizeBody(
        (request.body as Record<string, unknown>) ?? {},
      );
      const durationMs = Date.now() - start;
      const action = `${meta.subType}；耗时 ${durationMs}ms；参数 ${JSON.stringify(safeBody)}`;

      const ua = request.headers?.['user-agent'];
      const userAgent = Array.isArray(ua) ? ua[0] : ua ?? '';

      await this.operateLogService.createOperateLog({
        traceId: randomUUID(),
        userId: loginUser.id,
        userType: loginUser.userType ?? USER_TYPE_ADMIN,
        type: meta.type,
        subType: meta.subType,
        bizId,
        action,
        extra: JSON.stringify({ query: request.query ?? {} }),
        requestMethod: request.method ?? '',
        requestUrl: (request.url ?? '').slice(0, 255),
        userIp: String(request.ip ?? ''),
        userAgent: userAgent.slice(0, 512),
      });
    } catch (err) {
      this.logger.warn(
        `写操作日志失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
