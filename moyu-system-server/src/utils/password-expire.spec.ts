import { isPasswordExpired } from './password-expire';
import { PASSWORD_EXPIRE_DAYS } from '@/config/constants';

describe('isPasswordExpired', () => {
  it('未过期：改密时间在有效期内', () => {
    const now = new Date('2026-09-06T00:00:00Z');
    const updated = new Date('2026-08-01T00:00:00Z');
    expect(isPasswordExpired(updated, undefined, now, 90)).toBe(false);
  });

  it('已过期：超过有效天数', () => {
    const now = new Date('2026-09-06T00:00:00Z');
    const updated = new Date('2026-01-01T00:00:00Z');
    expect(isPasswordExpired(updated, undefined, now, 90)).toBe(true);
  });

  it('无改密时间时回退 createTime', () => {
    const now = new Date('2026-09-06T00:00:00Z');
    const created = new Date('2025-01-01T00:00:00Z');
    expect(isPasswordExpired(null, created, now, PASSWORD_EXPIRE_DAYS)).toBe(
      true,
    );
  });

  it('时间都缺失时不过期', () => {
    expect(isPasswordExpired(null, null)).toBe(false);
  });
});
