import { assertSocialRedirectAllowed } from './social-redirect';
import { AuthError } from '@/config/error-messages';

describe('assertSocialRedirectAllowed', () => {
  it('rejects empty or non-http urls', () => {
    expect(() => assertSocialRedirectAllowed('')).toThrow(
      AuthError.REDIRECT_URI_REQUIRED,
    );
    expect(() => assertSocialRedirectAllowed('javascript:alert(1)')).toThrow(
      AuthError.REDIRECT_URI_SCHEME,
    );
    expect(() => assertSocialRedirectAllowed('ftp://x.com')).toThrow(
      AuthError.REDIRECT_URI_SCHEME,
    );
  });

  it('rejects empty allowlist unless DEV_OPEN', () => {
    expect(() =>
      assertSocialRedirectAllowed('https://app.example.com/cb', {
        allowlist: '',
        nodeEnv: 'development',
        devOpen: 'false',
      }),
    ).toThrow(AuthError.SOCIAL_REDIRECT_ALLOWLIST_REQUIRED);
  });

  it('allows empty allowlist when DEV_OPEN in non-prod', () => {
    expect(() =>
      assertSocialRedirectAllowed('https://app.example.com/cb', {
        allowlist: '',
        nodeEnv: 'development',
        devOpen: 'true',
      }),
    ).not.toThrow();
  });

  it('requires allowlist in production even with DEV_OPEN', () => {
    expect(() =>
      assertSocialRedirectAllowed('https://app.example.com/cb', {
        allowlist: '',
        nodeEnv: 'production',
        devOpen: 'true',
      }),
    ).toThrow(AuthError.SOCIAL_REDIRECT_ALLOWLIST_REQUIRED);
  });

  it('enforces allowlist prefixes', () => {
    expect(() =>
      assertSocialRedirectAllowed('https://evil.com/cb', {
        allowlist: 'https://app.example.com/',
        nodeEnv: 'production',
      }),
    ).toThrow(AuthError.REDIRECT_URI_NOT_ALLOWED);
    expect(() =>
      assertSocialRedirectAllowed('https://app.example.com/oauth/cb', {
        allowlist: 'https://app.example.com/',
        nodeEnv: 'production',
      }),
    ).not.toThrow();
  });
});
