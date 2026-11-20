/**
 * 校验社交登录 redirectUri，防止开放重定向。
 * - 仅允许 http/https
 * - 须配置 SOCIAL_REDIRECT_ALLOWLIST（逗号分隔前缀）并命中
 * - 仅当显式 SOCIAL_REDIRECT_DEV_OPEN=true 且非生产时，允许空白名单（本地联调）
 */
import { AuthError } from '@/config/error-messages';

export function assertSocialRedirectAllowed(
  redirectUri: string,
  options?: {
    allowlist?: string;
    nodeEnv?: string;
    devOpen?: string;
  },
): void {
  const raw = (redirectUri || '').trim();
  if (!raw) {
    throw new Error(AuthError.REDIRECT_URI_REQUIRED);
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(AuthError.REDIRECT_URI_INVALID);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(AuthError.REDIRECT_URI_SCHEME);
  }

  const env = options?.nodeEnv ?? process.env.NODE_ENV;
  const allowlistRaw =
    options?.allowlist ?? process.env.SOCIAL_REDIRECT_ALLOWLIST ?? '';
  const allowlist = allowlistRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    const devOpen =
      (options?.devOpen ?? process.env.SOCIAL_REDIRECT_DEV_OPEN) === 'true' ||
      (options?.devOpen ?? process.env.SOCIAL_REDIRECT_DEV_OPEN) === '1';
    if (env === 'production' || !devOpen) {
      throw new Error(
        AuthError.SOCIAL_REDIRECT_ALLOWLIST_REQUIRED,
      );
    }
    return;
  }

  const ok = allowlist.some(
    (prefix) => raw === prefix || raw.startsWith(prefix),
  );
  if (!ok) {
    throw new Error(AuthError.REDIRECT_URI_NOT_ALLOWED);
  }
}
