import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SKIP_TENANT_CHECK_KEY,
  TENANT_ID_HEADER,
  USER_TYPE_ADMIN,
} from '@/config/constants';
import { OpLogSub, OpLogType, TenantError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { PermissionService } from '@/modules/permission/permission/permission.service';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { isSuperAdmin } from '@/utils/super-admin';
import { randomUUID } from 'node:crypto';

/**
 * TenantGuard — 多租户隔离守卫（位于 JwtGuard 之后）
 *
 * 规则：
 * - @SkipTenantCheck → 标记 ignore，不注入租户条件（平台级接口）
 * - 未登录（@SkipAuth）→ 不强制租户；登录接口自行从 header/body 解析
 * - 已登录 → 以 token 中的 tenantId 为准；若请求头带 tenant-id 则必须一致
 * - 超级管理员可在请求头指定其它租户（跨租户运维），切换会写操作日志
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly operateLogService: OperateLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      TenantContext.setIgnore(true);
      return true;
    }

    const request = this.getRequest(context);
    if (!request) {
      return true;
    }

    const user = (request.loginUser ?? request.user) as LoginUser | undefined;
    if (!user?.id) {
      const headerTenant = this.readHeaderTenant(request);
      if (headerTenant) {
        TenantContext.setTenantId(headerTenant);
      }
      return true;
    }

    const tokenTenant = user.tenantId || '0';
    const headerTenant = this.readHeaderTenant(request);

    let effectiveTenant = tokenTenant;

    if (headerTenant && headerTenant !== tokenTenant) {
      if (!user.roles) {
        const bundle = await this.permissionService.getUserAccessBundle(
          user.id,
        );
        user.roles = bundle.roles;
        user.permissions = bundle.permissions;
        request.loginUser = user;
        request.user = user;
      }
      if (!isSuperAdmin(user.roles)) {
        throw new ForbiddenException(TenantError.USER_NOT_BELONG);
      }
      effectiveTenant = headerTenant;
      void this.auditTenantSwitch(user, tokenTenant, headerTenant, request);
    }

    TenantContext.setTenantId(effectiveTenant);
    user.tenantId = effectiveTenant;
    request.loginUser = user;
    request.user = user;
    return true;
  }

  private async auditTenantSwitch(
    user: LoginUser,
    fromTenant: string,
    toTenant: string,
    request: { method?: string; url?: string; ip?: string },
  ): Promise<void> {
    this.logger.warn(
      `超管切换租户 userId=${user.id} ${fromTenant} → ${toTenant} ${request.method ?? ''} ${request.url ?? ''}`,
    );
    try {
      await this.operateLogService.createOperateLog({
        traceId: randomUUID(),
        userId: user.id,
        userType: user.userType ?? USER_TYPE_ADMIN,
        type: OpLogType.TENANT_OPS,
        subType: OpLogSub.TENANT_SWITCH,
        bizId: 0,
        action: `tenant ${fromTenant} → ${toTenant}`,
        extra: JSON.stringify({ fromTenant, toTenant }),
        requestMethod: request.method ?? '',
        requestUrl: request.url ?? '',
        userIp: request.ip ?? '',
        userAgent: '',
      });
    } catch (err) {
      this.logger.error(
        '写入超管切换租户操作日志失败',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private readHeaderTenant(request: any): string | undefined {
    const raw =
      request.headers?.[TENANT_ID_HEADER] ??
      request.headers?.['tenant_id'] ??
      request.headers?.['x-tenant-id'];
    if (!raw) return undefined;
    const value = Array.isArray(raw) ? raw[0] : String(raw);
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  private getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    return null;
  }
}
