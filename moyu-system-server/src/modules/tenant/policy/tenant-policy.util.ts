/**
 * 租户策略纯函数（便于单测，无 DB 依赖）
 */

/** 账号配额：accountCount < 0 表示不限 */
export function isAccountQuotaUnlimited(accountCount: number): boolean {
  return accountCount < 0;
}

/**
 * 是否还可创建 extra 个用户
 * @param accountCount 租户上限（<0 不限）
 * @param currentUsers 当前未删除用户数
 * @param extra 本次拟创建数（默认 1）
 */
export function canCreateUsers(
  accountCount: number,
  currentUsers: number,
  extra = 1,
): boolean {
  if (isAccountQuotaUnlimited(accountCount)) return true;
  return currentUsers + extra <= accountCount;
}

/** 租户是否已过期（expireTime 为空视为不过期） */
export function isTenantExpired(
  expireTime: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expireTime) return false;
  return expireTime.getTime() <= now.getTime();
}

/** 租户是否启用（status === 1） */
export function isTenantEnabled(status: number): boolean {
  return status === 1;
}
