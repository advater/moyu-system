/**
 * 脱敏工具 — 日志过滤与 API 响应密钥掩码
 */

/** 请求体中需要脱敏的字段名列表 */
export const BODY_SENSITIVE_KEYS = [
  'password',
  'rePassword',
  'token',
  'secret',
  'clientSecret',
  'apiSecret',
  'apiKey',
  'refresh_token',
  'refreshToken',
  'access_token',
  'accessToken',
  'creditCard',
  'salt',
];

/**
 * 将密钥类字段掩码后用于 API 响应（不回传明文）。
 * 空值返回空串；短密钥整段打码；其余保留末 4 位便于辨认。
 */
export function maskSecret(value?: string | null): string {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return `****${value.slice(-4)}`;
}

/** 更新时：空串 / undefined / 掩码占位视为「不修改原密钥」 */
export function shouldKeepExistingSecret(value?: string | null): boolean {
  if (value === undefined || value === null || value === '') return true;
  return value.startsWith('****');
}

/** HTTP 请求头中需要脱敏的字段名列表 */
export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'x-xsrf-token',
];

/** 过滤请求体中的敏感字段，返回浅拷贝（不修改原始对象） */
export function sanitizeBody(
  body: Record<string, any>,
  keys: readonly string[] = BODY_SENSITIVE_KEYS,
): Record<string, any> {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  for (const key of keys) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

/** 过滤 HTTP 请求头中的敏感字段，返回浅拷贝（不修改原始对象） */
export function sanitizeHeaders(
  headers: Record<string, any>,
  keys: readonly string[] = SENSITIVE_HEADERS,
): Record<string, any> {
  const sanitized = { ...headers };
  for (const key of keys) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}