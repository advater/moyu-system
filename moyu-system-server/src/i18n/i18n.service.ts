import { Injectable } from '@nestjs/common';
import { messages as zhCN } from './locales/zh-CN';
import { messages as enUS } from './locales/en-US';
import {
  AppLocale,
  DEFAULT_LOCALE,
  I18nContext,
  SUPPORTED_LOCALES,
} from './i18n.context';
import {
  interpolate,
  resolveLocale,
  resolveOpsCopy,
} from './i18n.util';

const CATALOGS = {
  'zh-CN': zhCN as Record<string, string>,
  'en-US': enUS as Record<string, string>,
};

@Injectable()
export class I18nService {
  /** 当前请求语言（依赖 I18nMiddleware / ALS） */
  currentLocale(): AppLocale {
    return I18nContext.getLocale();
  }

  supportedLocales(): AppLocale[] {
    return [...SUPPORTED_LOCALES];
  }

  resolveFromHeaders(headers: Record<string, unknown>): AppLocale {
    const xLang = headers['x-lang'] ?? headers['X-Lang'];
    const accept = headers['accept-language'] ?? headers['Accept-Language'];
    const fromX = resolveLocale(
      typeof xLang === 'string' ? xLang : Array.isArray(xLang) ? xLang[0] : null,
    );
    if (typeof xLang === 'string' && xLang.trim()) return fromX;
    return resolveLocale(
      typeof accept === 'string'
        ? accept
        : Array.isArray(accept)
          ? accept[0]
          : null,
    );
  }

  t(
    key: string,
    args?: Record<string, string | number>,
    locale?: AppLocale,
  ): string {
    const lang = locale ?? this.currentLocale();
    const catalog = CATALOGS[lang] ?? CATALOGS[DEFAULT_LOCALE];
    const fallback = CATALOGS[DEFAULT_LOCALE];
    const template = catalog[key] ?? fallback[key] ?? key;
    return interpolate(template, args);
  }

  /**
   * 翻译异常/成功/运营覆盖文案：
   * - JSON 双语运营文案
   * - `AUTH.X` / `AUTH.X?a=1` 词条
   * - 历史自由文本原文返回
   */
  translateMessage(raw: string, locale?: AppLocale): string {
    return resolveOpsCopy(raw, locale ?? this.currentLocale(), CATALOGS);
  }
}
