import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  PERMISSION_MODE_KEY,
} from '@/config/constants';
import { PermissionError, TenantError } from '@/config/error-messages';
import { PermissionService } from '@/modules/permission/permission/permission.service';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { isSuperAdmin } from '@/utils/super-admin';
import { auditAuthorizationDenied } from './authorization-audit';

/**
 * 权限守卫 — 基于 @Permission 权限标识的细粒度访问控制
 *
 * 规则：
 * - 未声明 @Permission → 放行（仍受 JwtGuard 登录约束）
 * - 超级管理员（super_admin）→ 放行
 * - 默认 OR：拥有任一权限码即可；@PermissionMode('and') 时需全部具备
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly operateLogService: OperateLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = this.getUser(context);
    if (!user?.id) {
      throw new ForbiddenException(PermissionError.NOT_LOGGED_IN);
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException(TenantError.SELECT_REQUIRED);
    }

    // 已挂载过则复用，避免同请求重复查库
    let roles = user.roles;
    let permissions = user.permissions;

    if (!roles || !permissions) {
      const bundle = await this.permissionService.getUserAccessBundle(user.id);
      roles = bundle.roles;
      permissions = bundle.permissions;
      user.roles = roles;
      user.permissions = permissions;
      this.attachUser(context, user);
    }

    if (isSuperAdmin(roles)) {
      return true;
    }

    const mode =
      this.reflector.getAllAndOverride<'and' | 'or'>(PERMISSION_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'or';

    const owned = new Set(permissions ?? []);
    const ok =
      mode === 'and'
        ? requiredPermissions.every((p) => owned.has(p))
        : requiredPermissions.some((p) => owned.has(p));

    if (!ok) {
      auditAuthorizationDenied(this.operateLogService, context, user, {
        kind: 'permission',
        required: requiredPermissions,
        mode,
      });
      throw new ForbiddenException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
      );
    }
    return true;
  }

  private getUser(context: ExecutionContext): LoginUser | null {
    if (context.getType() !== 'http') {
      return null;
    }
    const req = context.switchToHttp().getRequest();
    return (req.loginUser ?? req.user) as LoginUser | null;
  }

  private attachUser(context: ExecutionContext, user: LoginUser): void {
    if (context.getType() !== 'http') return;
    const req = context.switchToHttp().getRequest();
    req.loginUser = user;
    req.user = user;
  }
}
