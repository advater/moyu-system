import { SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';

/**
 * 超管判定唯一入口
 *
 * 超管语义：跳过 `@Permission` / `@Roles` 校验，可带头切换租户运维
 * （见 docs/TENANT_AND_PERMISSION.md 1.6）。所有鉴权/业务分支都应复用本函数，
 * 避免各处自行 `roles.includes('super_admin')` 造成判定漂移。
 */
export function isSuperAdmin(roles?: readonly string[] | null): boolean {
  return !!roles?.includes(SYSTEM_ADMIN_ROLE_CODE);
}
