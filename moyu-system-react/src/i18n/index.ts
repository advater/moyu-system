import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "@/locales/zh-CN";
import en from "@/locales/en";
import Storage from "@/utils/storage";
import { CACHE_KEY } from "@/store/cacheKey";

const lng = Storage.get<string>(CACHE_KEY.LANG) || "zh-CN";

void i18next.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    en: { translation: en },
  },
  lng,
  fallbackLng: "zh-CN",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = lng;
}

export default i18next;
