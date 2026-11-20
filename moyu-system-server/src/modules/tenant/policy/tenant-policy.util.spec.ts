import {
  canCreateUsers,
  isAccountQuotaUnlimited,
  isTenantEnabled,
  isTenantExpired,
} from './tenant-policy.util';

describe('tenant-policy.util', () => {
  it('accountCount < 0 means unlimited', () => {
    expect(isAccountQuotaUnlimited(-1)).toBe(true);
    expect(isAccountQuotaUnlimited(0)).toBe(false);
    expect(canCreateUsers(-1, 999, 10)).toBe(true);
  });

  it('enforces finite quota', () => {
    expect(canCreateUsers(5, 4, 1)).toBe(true);
    expect(canCreateUsers(5, 5, 1)).toBe(false);
    expect(canCreateUsers(5, 3, 2)).toBe(true);
    expect(canCreateUsers(5, 3, 3)).toBe(false);
    expect(canCreateUsers(0, 0, 1)).toBe(false);
  });

  it('detects expire and status', () => {
    const now = new Date('2026-09-06T12:00:00Z');
    expect(isTenantExpired(null, now)).toBe(false);
    expect(isTenantExpired(new Date('2026-09-07T00:00:00Z'), now)).toBe(false);
    expect(isTenantExpired(new Date('2026-09-06T11:00:00Z'), now)).toBe(true);
    expect(isTenantEnabled(1)).toBe(true);
    expect(isTenantEnabled(0)).toBe(false);
  });
});
