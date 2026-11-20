import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/config/constants';
import { PermissionError } from '@/config/error-messages';
import { PermissionService } from '@/modules/permission/permission/permission.service';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { isSuperAdmin } from '@/utils/super-admin';
import { auditAuthorizationDenied } from './authorization-audit';

/**
 * 角色守卫 — 基于 @Roles 角色 code 进行访问控制
 *
 * 未声明 @Roles → 放行；超级管理员放行；否则校验 user.roles（缺失时按需加载）。
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly operateLogService: OperateLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = (request.loginUser ?? request.user) as LoginUser | undefined;

    if (!user?.id) {
      throw new ForbiddenException(PermissionError.MISSING_USER_ROLES);
    }

    if (!user.roles) {
      const bundle = await this.permissionService.getUserAccessBundle(user.id);
      user.roles = bundle.roles;
      user.permissions = bundle.permissions;
      request.loginUser = user;
      request.user = user;
    }

    if (isSuperAdmin(user.roles)) {
      return true;
    }

    const hasRole = user.roles.some((roleCode) => roles.includes(roleCode));
    if (!hasRole) {
      auditAuthorizationDenied(this.operateLogService, context, user, {
        kind: 'role',
        required: roles,
      });
      throw new ForbiddenException(PermissionError.INSUFFICIENT_ROLES);
    }

    return true;
  }
}
