import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import { useTranslation } from "react-i18next";
import { applyAppTheme, applyAuthPageTheme, AUTH_PRIMARY, useAppStore } from "@/store/stores/app";
import { useLocaleStore } from "@/store/stores/locale";
import { bindMessageApi } from "@/utils/index";
import { setCssVar } from "@/utils/cssVar";
import { dsStructure } from "@/styles/dsStructure";
import i18n from "@/i18n";

function MessageBridge({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  bindMessageApi(message);
  return children;
}

export default function ThemeProvider({
  children,
  forceLight = false,
}: {
  children: ReactNode;
  forceLight?: boolean;
}) {
  const { theme, isDark, greyMode, currentSize, tagsView } = useAppStore();
  const { lang } = useLocaleStore();
  const { i18n: i18nInstance } = useTranslation();
  const light = forceLight || !isDark;

  useLayoutEffect(() => {
    if (forceLight) {
      applyAuthPageTheme();
      return;
    }
    applyAppTheme(theme, isDark, greyMode);
  }, [forceLight, theme, isDark, greyMode]);

  useEffect(() => {
    setCssVar("--tags-view-height", tagsView ? "40px" : "0px");
  }, [tagsView]);

  useEffect(() => {
    if (i18nInstance.language !== lang) {
      void i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
    dayjs.locale(lang === "en" ? "en" : "zh-cn");
  }, [lang, i18nInstance.language]);

  return (
    <ConfigProvider
      locale={lang === "en" ? enUS : zhCN}
      componentSize={forceLight ? "middle" : currentSize}
      theme={{
        algorithm: light ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
        token: {
          // 颜色：主题系统 / 登录页固定主色
          colorPrimary: forceLight ? AUTH_PRIMARY : theme.elColorPrimary,
          colorBgLayout: light ? (forceLight ? "#f5f7fa" : "#f5f6f8") : undefined,
          // 结构：live-zb-uni（与主题色解耦）
          borderRadius: dsStructure.radius,
          borderRadiusSM: dsStructure.radiusSmall,
          borderRadiusLG: dsStructure.radius,
          borderRadiusXS: dsStructure.radiusSmall,
          controlHeight: dsStructure.heightMedium,
          controlHeightSM: dsStructure.heightSmall,
          controlHeightLG: dsStructure.heightLarge,
          fontSize: dsStructure.fontSize,
          fontSizeSM: dsStructure.fontSizeSM,
          fontSizeLG: dsStructure.fontSizeLG,
          fontSizeHeading4: dsStructure.titleSizeLarge,
          fontSizeHeading5: dsStructure.titleSize,
          lineHeight: dsStructure.lineHeight,
          boxShadow: dsStructure.shadow2,
          boxShadowSecondary: dsStructure.shadow2,
          motionEaseInOut: dsStructure.motionEase,
        },
        components: {
          Layout: {
            headerHeight: dsStructure.headerHeight,
          },
          Menu: {
            itemHeight: dsStructure.menuItemHeight,
            itemBorderRadius: dsStructure.radiusSmall,
          },
          Table: {
            cellPaddingBlock: dsStructure.cellPadding,
            cellPaddingInline: dsStructure.cellPadding,
            cellPaddingBlockSM: dsStructure.cellPaddingSM,
            cellPaddingInlineSM: dsStructure.cellPaddingSM,
            headerBorderRadius: dsStructure.radiusSmall,
          },
          Pagination: {
            itemSize: dsStructure.heightSmall,
            itemSizeSM: dsStructure.heightTiny,
          },
          Modal: {
            titleFontSize: dsStructure.titleSizeLarge,
            borderRadiusLG: dsStructure.radius,
          },
          Card: {
            headerFontSize: dsStructure.titleSize,
            borderRadiusLG: dsStructure.radius,
          },
          Button: {
            borderRadius: dsStructure.radiusSmall,
            borderRadiusSM: dsStructure.radiusSmall,
            borderRadiusLG: dsStructure.radius,
            primaryShadow: "none",
            defaultShadow: "none",
            dangerShadow: "none",
          },
          Input: {
            borderRadius: dsStructure.radiusSmall,
          },
          Tag: {
            borderRadiusSM: dsStructure.radiusSmall,
          },
        },
      }}
    >
      <App style={{ height: "100%", minHeight: "100%" }}>
        <MessageBridge>{children}</MessageBridge>
      </App>
    </ConfigProvider>
  );
}
