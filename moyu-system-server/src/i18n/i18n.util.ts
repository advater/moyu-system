/**
 * 将消息 key + 参数编码进 HttpException.message，供过滤器翻译。
 * 无参数时直接返回 key（如 AUTH.INVALID_TOKEN）。
 */
export function i18nKey(
  key: string,
  args?: Record<string, string | number>,
): string {
  if (!args || Object.keys(args).length === 0) return key;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) {
    q.set(k, String(v));
  }
  return `${key}?${q.toString()}`;
}

const KEY_RE = /^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*)+/;

export function parseI18nMessage(raw: string): {
  key: string;
  args?: Record<string, string>;
} | null {
  if (!raw || typeof raw !== 'string') return null;
  const qIdx = raw.indexOf('?');
  const keyPart = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  if (!KEY_RE.test(keyPart)) return null;
  if (qIdx < 0) return { key: keyPart };
  const args: Record<string, string> = {};
  const params = new URLSearchParams(raw.slice(qIdx + 1));
  params.forEach((v, k) => {
    args[k] = v;
  });
  return { key: keyPart, args };
}

export function interpolate(
  template: string,
  args?: Record<string, string | number>,
): string {
  if (!args) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    args[name] != null ? String(args[name]) : `{${name}}`,
  );
}

/** Accept-Language / X-Lang → 受支持 locale */
export function resolveLocale(
  raw?: string | string[] | null,
): 'zh-CN' | 'en-US' {
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header?.trim()) return 'zh-CN';
  const primary = header.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.startsWith('en')) return 'en-US';
  if (primary.startsWith('zh')) return 'zh-CN';
  if (primary === 'en-us' || primary === 'en_gb') return 'en-US';
  return 'zh-CN';
}

export type LocaleCatalogs = {
  'zh-CN': Record<string, string>;
  'en-US': Record<string, string>;
};

/**
 * 运营/业务文案解析：
 * 1) JSON 双语 `{"zh-CN":"...","en-US":"..."}`
 * 2) i18n key（含 `KEY?a=1`）
 * 3) 其它原文（兼容历史自由文本）
 */
export function resolveOpsCopy(
  raw: string,
  locale: 'zh-CN' | 'en-US',
  catalogs: LocaleCatalogs,
): string {
  if (!raw || typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const hit =
          obj[locale] ??
          obj['zh-CN'] ??
          obj['en-US'] ??
          obj.zh ??
          obj.en;
        if (typeof hit === 'string' && hit.trim()) return hit;
      }
    } catch {
      /* fallthrough */
    }
  }
  const parsed = parseI18nMessage(trimmed);
  if (!parsed) return raw;
  const primary = catalogs[locale] ?? catalogs['zh-CN'];
  const fallback = catalogs['zh-CN'];
  const template =
    primary[parsed.key] ?? fallback[parsed.key] ?? parsed.key;
  return interpolate(template, parsed.args);
}
