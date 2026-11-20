import { ExecutionContext } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import { OpLogSub, OpLogType } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import type { LoginUser } from '@/common/decorator/login-user.decorator';

interface HttpRequestMeta {
  method?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * 鉴权拒绝审计 — 落一条操作日志（模块「权限」/ 子类型「鉴权拒绝」）
 *
 * 通过鉴权放行由 `sys_api_access_log` 记录；此处只补拒绝侧留痕。
 * 日志写入失败不影响主流程（拒绝结果以异常为准）。
 */
export function auditAuthorizationDenied(
  operateLogService: OperateLogService,
  context: ExecutionContext,
  user: LoginUser,
  detail: { kind: 'permission' | 'role'; required: string[]; mode?: 'and' | 'or' },
): void {
  const request =
    context.getType() === 'http'
      ? context.switchToHttp().getRequest<HttpRequestMeta>()
      : undefined;
  const ua = request?.headers?.['user-agent'];
  const userAgent = (Array.isArray(ua) ? ua[0] : (ua ?? '')) as string;

  void operateLogService
    .createOperateLog({
      traceId: randomUUID(),
      tenantId:
        TenantContext.getTenantId() || user.tenantId || DEFAULT_TENANT_ID,
      userId: user.id,
      userType: user.userType,
      type: OpLogType.PERMISSION,
      subType: OpLogSub.PERMISSION_DENIED,
      action: `${OpLogSub.PERMISSION_DENIED}；${request?.method ?? ''} ${request?.url ?? ''}；${detail.kind}=${detail.required.join(',')}`,
      extra: JSON.stringify({
        kind: detail.kind,
        required: detail.required,
        mode: detail.mode ?? '',
        path: request?.url ?? '',
      }),
      requestMethod: (request?.method ?? '').slice(0, 16) || null,
      requestUrl: (request?.url ?? '').slice(0, 255) || null,
      userIp: (request?.ip ?? '').slice(0, 50),
      userAgent: userAgent.slice(0, 512),
    })
    .catch(() => undefined);
}
