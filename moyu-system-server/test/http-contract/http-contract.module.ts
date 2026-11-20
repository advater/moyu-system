import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtGuard } from '@/common/guard/jwt-auth.guard';
import { TenantGuard } from '@/common/guard/tenant.guard';
import { RoleGuard } from '@/common/guard/role-auth.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { CatchExceptionFilter } from '@/common/filters/catch-exception.filter';
import { ResponseInterceptor } from '@/common/interceptor/response.interceptor';
import { TenantAsyncMiddleware } from '@/common/middleware/tenant.middleware';
import { I18nModule, I18nMiddleware, I18nService } from '@/i18n';
import { LoggerService } from '@/plugins/logger/logger.service';
import { OAuth2TokenService } from '@/modules/oauth2/oauth2Token/oauth2Token.service';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { PermissionService } from '@/modules/permission/permission/permission.service';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { DataScopeService } from '@/modules/permission/permission/data-scope.service';
import {
  HttpContractDeptController,
  HttpContractProfileController,
  HttpContractTokenController,
  HttpContractUserController,
} from './controllers';
import {
  HttpContractLoggerService,
  HttpContractOperateLogService,
  HttpContractPermissionService,
  HttpContractTenantPolicyService,
  HttpContractTokenService,
  memoryDeptRepository,
  memoryRoleRepository,
  memoryUserRepository,
  memoryUserRoleRepository,
} from './fakes';

/**
 * 用 useFactory 显式 new 守卫 / 过滤器，避免 tsx 不发 design:paramtypes
 * 导致 Nest 把构造参数当成 undefined。
 */
@Module({
  imports: [I18nModule],
  controllers: [
    HttpContractUserController,
    HttpContractDeptController,
    HttpContractTokenController,
    HttpContractProfileController,
  ],
  providers: [
    TenantAsyncMiddleware,
    I18nMiddleware,
    HttpContractTokenService,
    HttpContractTenantPolicyService,
    HttpContractPermissionService,
    HttpContractOperateLogService,
    HttpContractLoggerService,
    { provide: OAuth2TokenService, useExisting: HttpContractTokenService },
    { provide: TenantPolicyService, useExisting: HttpContractTenantPolicyService },
    { provide: PermissionService, useExisting: HttpContractPermissionService },
    { provide: OperateLogService, useExisting: HttpContractOperateLogService },
    { provide: LoggerService, useExisting: HttpContractLoggerService },
    {
      provide: DataScopeService,
      useFactory: () =>
        new DataScopeService(
          memoryUserRoleRepository as never,
          memoryRoleRepository as never,
          memoryUserRepository as never,
          memoryDeptRepository as never,
        ),
    },
    {
      provide: JwtGuard,
      useFactory: (
        reflector: Reflector,
        token: OAuth2TokenService,
        policy: TenantPolicyService,
      ) => new JwtGuard(reflector, token, policy),
      inject: [Reflector, OAuth2TokenService, TenantPolicyService],
    },
    {
      provide: TenantGuard,
      useFactory: (
        reflector: Reflector,
        permission: PermissionService,
        operateLog: OperateLogService,
      ) => new TenantGuard(reflector, permission, operateLog),
      inject: [Reflector, PermissionService, OperateLogService],
    },
    {
      provide: RoleGuard,
      useFactory: (
        reflector: Reflector,
        permission: PermissionService,
        operateLog: OperateLogService,
      ) => new RoleGuard(reflector, permission, operateLog),
      inject: [Reflector, PermissionService, OperateLogService],
    },
    {
      provide: PermissionGuard,
      useFactory: (
        reflector: Reflector,
        permission: PermissionService,
        operateLog: OperateLogService,
      ) => new PermissionGuard(reflector, permission, operateLog),
      inject: [Reflector, PermissionService, OperateLogService],
    },
    { provide: APP_GUARD, useExisting: JwtGuard },
    { provide: APP_GUARD, useExisting: TenantGuard },
    { provide: APP_GUARD, useExisting: RoleGuard },
    { provide: APP_GUARD, useExisting: PermissionGuard },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector, i18n: I18nService) =>
        new ResponseInterceptor(reflector, i18n),
      inject: [Reflector, I18nService],
    },
    {
      provide: APP_FILTER,
      useFactory: (logger: LoggerService, i18n: I18nService) =>
        new CatchExceptionFilter(logger, undefined, undefined, i18n),
      inject: [LoggerService, I18nService],
    },
  ],
})
export class HttpContractModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware, TenantAsyncMiddleware).forRoutes('*');
  }
}
