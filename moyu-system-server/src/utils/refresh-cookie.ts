import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAppConfig } from '@/config/file.config';

/** Refresh Token Cookie 名（httpOnly，缩小 XSS 读令牌面） */
export const REFRESH_TOKEN_COOKIE = 'moyu_rt';

function authCookiePath(): string {
  const prefix = String(getAppConfig().apiPrefix || '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
  return prefix ? `/${prefix}/auth` : '/auth';
}

export function refreshCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
} {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    // 覆盖认证相关路径，避免全站携带（需含全局 API 前缀）
    path: authCookiePath(),
    maxAge: 7 * 24 * 60 * 60, // 7 天（秒）
  };
}

export function setRefreshTokenCookie(
  reply: FastifyReply,
  refreshToken: string,
): void {
  if (!refreshToken) return;
  reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
}

export function clearRefreshTokenCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_TOKEN_COOKIE, {
    path: refreshCookieOptions().path,
  });
}

export function readRefreshTokenCookie(
  request: FastifyRequest,
): string | undefined {
  const cookies = (request as FastifyRequest & {
    cookies?: Record<string, string>;
  }).cookies;
  const raw = cookies?.[REFRESH_TOKEN_COOKIE]?.trim();
  return raw || undefined;
}
