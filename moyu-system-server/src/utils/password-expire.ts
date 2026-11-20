import { PASSWORD_EXPIRE_DAYS } from '@/config/constants';

/**
 * 判断密码是否已过期
 * @param passwordUpdateTime 最近改密时间
 * @param createTime 账号创建时间（改密时间为空时回退）
 * @param now 当前时间（可注入便于单测）
 * @param expireDays 有效天数
 */
export function isPasswordExpired(
  passwordUpdateTime: Date | string | null | undefined,
  createTime: Date | string | null | undefined,
  now: Date = new Date(),
  expireDays: number = PASSWORD_EXPIRE_DAYS,
): boolean {
  const baseline = passwordUpdateTime ?? createTime;
  if (!baseline) return false;
  const start = new Date(baseline);
  if (Number.isNaN(start.getTime())) return false;
  const expireAt = new Date(start);
  expireAt.setDate(expireAt.getDate() + expireDays);
  return now.getTime() > expireAt.getTime();
}
