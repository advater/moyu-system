import { AsyncLocalStorage } from 'async_hooks';

export type AppLocale = 'zh-CN' | 'en-US';

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
export const SUPPORTED_LOCALES: AppLocale[] = ['zh-CN', 'en-US'];

type Store = { locale: AppLocale };

const als = new AsyncLocalStorage<Store>();

export const I18nContext = {
  run<T>(locale: AppLocale, fn: () => T): T {
    return als.run({ locale }, fn);
  },
  getLocale(): AppLocale {
    return als.getStore()?.locale ?? DEFAULT_LOCALE;
  },
};
