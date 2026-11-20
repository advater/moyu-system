import { SetMetadata } from '@nestjs/common';
import {
  SKIP_AUTH_KEY,
  RAW_RESPONSE_KEY,
  ROLES_KEY,
  SKIP_TENANT_CHECK_KEY,
} from '@/config/constants';

/**
 *  接口不授权 方法装饰器
 * // example: @SkipAuth()
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

/**
 *  原始返回 方法装饰器
 * // example: @RawResponse()
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

/**
 * 角色 code，与库内 sys_role.code 对齐（供 @Roles 使用）
 */
export enum Role {
  SuperAdmin = 'super_admin',
  TenantAdmin = 'tenant_admin',
}

/**
 *  角色授权 方法装饰器
 * // example： @Roles(Role.SuperAdmin)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 跳过租户隔离（平台级租户/套餐管理等）
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);

/**
 *  权限 方法装饰器 — 统一从 permission.decorator.ts 导出，避免重复定义
 */
export { Permission } from './permission.decorator';
