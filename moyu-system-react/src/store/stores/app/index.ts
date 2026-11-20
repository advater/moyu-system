import { createSlice } from "@reduxjs/toolkit";
import Storage from "@/utils/storage";
import { applyThemeVars, setCssVar } from "@/utils/cssVar";
import { colorIsDark, mix } from "@/utils/color";
import { env } from "@/config/env";
import { CACHE_KEY } from "../../cacheKey";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  DEFAULT_THEME_ID,
  getWorkbenchTheme,
  WORKBENCH_THEMES,
  type ThemeConfig,
  type WorkbenchThemeId,
} from "@/config/workbenchThemes";

export { CACHE_KEY };
export type { ThemeConfig, WorkbenchThemeId };
export { DEFAULT_THEME_ID, WORKBENCH_THEMES, getWorkbenchTheme };

export type LayoutType = "sidebar-nav" | "header-nav" | "header-sidebar-nav";
export type ComponentSize = "small" | "middle" | "large";

export const DEFAULT_THEME: ThemeConfig = getWorkbenchTheme(DEFAULT_THEME_ID).theme;

function readCache<T>(key: string, fallback: T): T {
  const value = Storage.get<T>(key);
  return value == null ? fallback : value;
}

function isLegacyTheme(theme?: Partial<ThemeConfig> | null) {
  if (!theme) return true;
  if (theme.activityBarBgColor) return false;
  return theme.elColorPrimary === "#409eff" && theme.leftMenuBgColor === "#001529";
}

function persistTheme(colorTheme: WorkbenchThemeId, theme: ThemeConfig, isDark: boolean) {
  Storage.set(CACHE_KEY.COLOR_THEME, colorTheme);
  Storage.set(CACHE_KEY.THEME, theme);
  Storage.set(CACHE_KEY.IS_DARK, isDark);
}

function resolveInitialTheme() {
  const themeId = readCache<WorkbenchThemeId | null>(CACHE_KEY.COLOR_THEME, null);
  const cached = readCache<Partial<ThemeConfig> | null>(CACHE_KEY.THEME, null);
  if (themeId) {
    const preset = getWorkbenchTheme(themeId);
    return {
      colorTheme: preset.id,
      theme: { ...preset.theme, ...(cached || {}) },
      isDark: readCache<boolean>(CACHE_KEY.IS_DARK, preset.isDark),
    };
  }
  if (!isLegacyTheme(cached) && cached) {
    return {
      colorTheme: DEFAULT_THEME_ID,
      theme: { ...DEFAULT_THEME, ...cached },
      isDark: readCache<boolean>(CACHE_KEY.IS_DARK, colorIsDark(cached.leftMenuBgColor || "#ffffff")),
    };
  }
  const preset = getWorkbenchTheme(DEFAULT_THEME_ID);
  return {
    colorTheme: preset.id,
    theme: { ...preset.theme },
    isDark: preset.isDark,
  };
}

const boot = resolveInitialTheme();

const initialState = {
  title: env.title,
  breadcrumb: true,
  breadcrumbIcon: true,
  collapse: false,
  uniqueOpened: true,
  hamburger: true,
  screenfull: true,
  search: true,
  size: true,
  locale: true,
  message: true,
  tagsView: true,
  tagsViewImmerse: false,
  tagsViewIcon: true,
  logo: true,
  fixedHeader: true,
  footer: true,
  greyMode: false,
  layout: readCache<LayoutType>(CACHE_KEY.LAYOUT, "sidebar-nav"),
  isDark: boot.isDark,
  currentSize: readCache<ComponentSize>(CACHE_KEY.SIZE, "middle"),
  theme: boot.theme,
  colorTheme: boot.colorTheme,
  settingOpen: false,
};

export const AUTH_PRIMARY = "#1677ff";

function applyPrimaryTints(primary: string, isDark: boolean) {
  const mixColor = isDark ? "#000000" : "#ffffff";
  ;[3, 5, 7, 8, 9].forEach((v) => {
    setCssVar(`--el-color-primary-light-${v}`, mix(mixColor, primary, v / 10));
  });
  setCssVar("--el-color-primary-dark-2", mix(mixColor, primary, 0.2));
}

export function applyAuthPageTheme() {
  const root = document.documentElement;
  root.classList.remove("dark", "grey-mode");
  root.classList.add("light", "auth-page");
  applyPrimaryTints(AUTH_PRIMARY, false);
  setCssVar("--el-color-primary", AUTH_PRIMARY);
}

export function applyAppTheme(theme: ThemeConfig, isDark: boolean, greyMode: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.classList.toggle("grey-mode", greyMode);
  root.classList.remove("auth-page");
  applyThemeVars(theme);
  applyPrimaryTints(theme.elColorPrimary, isDark);
  setCssVar("--app-content-bg-color", theme.editorBgColor || (isDark ? "#1e1e1e" : "#ffffff"));
  setCssVar("--app-canvas-bg", isDark ? "#141414" : "#f5f6f8");
  setCssVar("--app-panel-bg", theme.editorBgColor || (isDark ? "#1e1e1e" : "#ffffff"));
  setCssVar("--app-panel-border", isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)");
  // 圆角等结构 token 由 ds-structure.css 提供，主题切换不覆盖
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    patchApp(state, action) {
      Object.assign(state, action.payload);
    },
    setTheme(state, action) {
      state.theme = { ...state.theme, ...action.payload };
      persistTheme(state.colorTheme, state.theme, state.isDark);
    },
    setColorTheme(state, action) {
      const preset = getWorkbenchTheme(action.payload);
      state.colorTheme = preset.id;
      state.theme = { ...preset.theme };
      state.isDark = preset.isDark;
      persistTheme(state.colorTheme, state.theme, state.isDark);
    },
    setAccent(state, action) {
      const color = action.payload as string;
      const dark = colorIsDark(color);
      state.theme = {
        ...state.theme,
        elColorPrimary: color,
        activityBarActiveBorder: color,
        statusBarBgColor: color,
        statusBarFgColor: dark ? "#ffffff" : "#333333",
      };
      persistTheme(state.colorTheme, state.theme, state.isDark);
    },
    setIsDark(state, action) {
      state.isDark = action.payload;
      persistTheme(state.colorTheme, state.theme, state.isDark);
    },
    setLayout(state, action) {
      state.layout = action.payload;
      Storage.set(CACHE_KEY.LAYOUT, state.layout);
    },
    setCurrentSize(state, action) {
      state.currentSize = action.payload;
      Storage.set(CACHE_KEY.SIZE, state.currentSize);
    },
    setCollapse(state, action) {
      state.collapse = action.payload;
    },
    setSettingOpen(state, action) {
      state.settingOpen = action.payload;
    },
    resetApp() {
      Storage.remove(CACHE_KEY.THEME);
      Storage.remove(CACHE_KEY.IS_DARK);
      Storage.remove(CACHE_KEY.LAYOUT);
      Storage.remove(CACHE_KEY.SIZE);
      Storage.remove(CACHE_KEY.COLOR_THEME);
      const preset = getWorkbenchTheme(DEFAULT_THEME_ID);
      return {
        ...initialState,
        theme: { ...preset.theme },
        isDark: preset.isDark,
        colorTheme: preset.id,
        layout: "sidebar-nav" as LayoutType,
      };
    },
  },
});

export const {
  patchApp,
  setTheme,
  setColorTheme,
  setAccent,
  setIsDark,
  setLayout,
  setCurrentSize,
  setCollapse,
  setSettingOpen,
  resetApp,
} = appSlice.actions;
export default appSlice.reducer;

export const ACCENT_COLORS = [
  "#007acc",
  "#0098ff",
  "#d18616",
  "#c586c0",
  "#89d185",
  "#f14c4c",
  "#3794ff",
  "#b180d7",
];

export const useAppStore = () => {
  const state = useAppSelector((s) => s.app);
  const dispatch = useAppDispatch();
  return {
    ...state,
    patchApp: (payload: Partial<typeof initialState>) => dispatch(patchApp(payload)),
    setTheme: (theme: Partial<ThemeConfig>) => dispatch(setTheme(theme)),
    setColorTheme: (id: WorkbenchThemeId | string) => dispatch(setColorTheme(id)),
    setAccent: (color: string) => dispatch(setAccent(color)),
    setIsDark: (value: boolean) => dispatch(setIsDark(value)),
    setLayout: (value: LayoutType) => dispatch(setLayout(value)),
    setCurrentSize: (value: ComponentSize) => dispatch(setCurrentSize(value)),
    setCollapse: (value: boolean) => dispatch(setCollapse(value)),
    setSettingOpen: (value: boolean) => dispatch(setSettingOpen(value)),
    resetApp: () => dispatch(resetApp()),
  };
};
