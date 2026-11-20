import { maskSecret, shouldKeepExistingSecret } from '@/utils/sanitize';

describe('sanitize secrets', () => {
  it('maskSecret masks long secrets keeping last 4', () => {
    expect(maskSecret('abcdefgh')).toBe('****efgh');
  });

  it('maskSecret masks short secrets fully', () => {
    expect(maskSecret('ab')).toBe('****');
  });

  it('shouldKeepExistingSecret treats empty and mask as keep', () => {
    expect(shouldKeepExistingSecret('')).toBe(true);
    expect(shouldKeepExistingSecret(undefined)).toBe(true);
    expect(shouldKeepExistingSecret('****abcd')).toBe(true);
    expect(shouldKeepExistingSecret('new-secret')).toBe(false);
  });
});
