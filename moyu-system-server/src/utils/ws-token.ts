/**
 * 从 WebSocket 握手提取 accessToken（禁止 URL Query，避免进代理/历史记录）。
 *
 * 支持：
 * - Authorization: Bearer <token>
 * - Sec-WebSocket-Protocol: bearer.<token> / access_token.<token>
 * - Sec-WebSocket-Protocol: access_token, <token>（双协议项）
 */
export function extractWsAccessToken(
  url: string | undefined,
  headers?: Record<string, string | string[] | undefined>,
): string {
  const auth = headerValue(headers, 'authorization');
  const fromAuth = normalizeBearer(auth);
  if (fromAuth) return fromAuth;

  const protocol = headerValue(headers, 'sec-websocket-protocol');
  const fromProto = extractFromProtocols(protocol);
  if (fromProto) return fromProto;

  // 显式忽略 query，防止回退到 ?token=
  void url;
  return '';
}

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string {
  if (!headers) return '';
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return String(raw[0] ?? '').trim();
  return String(raw ?? '').trim();
}

function normalizeBearer(raw?: string): string {
  if (!raw) return '';
  let token = raw.trim();
  if (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, '').trim();
  } else if (/^Bearer/i.test(token) && token.length > 6) {
    token = token.slice(6).trim();
  }
  return token;
}

function extractFromProtocols(protocolHeader: string): string {
  if (!protocolHeader) return '';
  const parts = protocolHeader.split(',').map((p) => p.trim()).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const lower = p.toLowerCase();
    if (lower.startsWith('bearer.')) {
      return p.slice('bearer.'.length).trim();
    }
    if (lower.startsWith('access_token.')) {
      return p.slice('access_token.'.length).trim();
    }
    if (lower === 'access_token' || lower === 'bearer') {
      const next = parts[i + 1];
      if (next) return next.trim();
    }
  }
  return '';
}
