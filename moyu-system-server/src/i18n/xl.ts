import { messages as zhCN } from './locales/zh-CN';
import { messages as enUS } from './locales/en-US';
import { I18nContext } from './i18n.context';
import { resolveOpsCopy } from './i18n.util';

const CATALOGS = {
  'zh-CN': zhCN as Record<string, string>,
  'en-US': enUS as Record<string, string>,
};

/** 按当前请求语言取词条（导出 / 操作日志展示 / 无 DI） */
export function xl(
  key: string,
  args?: Record<string, string | number>,
): string {
  const locale = I18nContext.getLocale();
  if (args && Object.keys(args).length > 0) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(args)) q.set(k, String(v));
    return resolveOpsCopy(`${key}?${q.toString()}`, locale, CATALOGS);
  }
  return resolveOpsCopy(key, locale, CATALOGS);
}
