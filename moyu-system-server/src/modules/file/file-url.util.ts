/**
 * 对外访问前缀（优先反代头，其次配置）
 */
import { getFileConfig } from '@/config/file.config';

export function publicFileBaseUrl(req?: {
  headers?: Record<string, string | string[] | undefined>;
  protocol?: string;
}): string {
  const forwardedProto = headerValue(req?.headers?.['x-forwarded-proto']);
  const forwardedHost = headerValue(req?.headers?.['x-forwarded-host']);
  const host = forwardedHost || headerValue(req?.headers?.host);
  if (host) {
    const protocol = forwardedProto || req?.protocol || 'http';
    return `${protocol}://${host}/`.replace(/([^:]\/)\/+/g, '$1');
  }
  const cfg = getFileConfig();
  return (cfg.baseUrl || '').replace(/\/?$/, '/');
}

export function previewFileUrl(
  fileId: number,
  req?: {
    headers?: Record<string, string | string[] | undefined>;
    protocol?: string;
  },
): string {
  return `${publicFileBaseUrl(req)}system/file/preview?id=${fileId}`;
}

function headerValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}
