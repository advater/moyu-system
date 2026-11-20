import { assertPasswordStrength, assertSecretStrength } from './password-strength';

describe('password-strength', () => {
  it('rejects weak / short passwords', () => {
    expect(() => assertPasswordStrength('short1', '密码', 12)).toThrow(/长度/);
    expect(() => assertPasswordStrength('onlylettersxxxx', '密码', 12)).toThrow(
      /字母与数字/,
    );
    expect(() => assertPasswordStrength('password12345', '密码', 12)).toThrow(
      /过于简单/,
    );
  });

  it('accepts strong passwords', () => {
    expect(() =>
      assertPasswordStrength('Str0ngImportPwd!', '密码', 12),
    ).not.toThrow();
  });

  it('rejects short secrets', () => {
    expect(() => assertSecretStrength('short', '密钥', 32)).toThrow(/长度/);
    expect(() =>
      assertSecretStrength('a'.repeat(32), '密钥', 32),
    ).not.toThrow();
  });
});
