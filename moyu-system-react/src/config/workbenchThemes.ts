export type ThemeConfig = {
  elColorPrimary: string;
  leftMenuBorderColor: string;
  leftMenuBgColor: string;
  leftMenuBgLightColor: string;
  leftMenuBgActiveColor: string;
  leftMenuCollapseBgActiveColor: string;
  leftMenuTextColor: string;
  leftMenuTextActiveColor: string;
  logoTitleTextColor: string;
  logoBorderColor: string;
  topHeaderBgColor: string;
  topHeaderTextColor: string;
  topHeaderHoverColor: string;
  topToolBorderColor: string;
  activityBarBgColor: string;
  activityBarFgColor: string;
  activityBarInactiveFg: string;
  activityBarActiveBorder: string;
  statusBarBgColor: string;
  statusBarFgColor: string;
  editorBgColor: string;
  tabBarBgColor: string;
  tabActiveBgColor: string;
};

export type WorkbenchThemeId =
  | "dark-plus"
  | "light-plus"
  | "monokai"
  | "solarized-dark"
  | "solarized-light"
  | "one-dark"
  | "github-dark"
  | "quiet-light";

export type WorkbenchTheme = {
  id: WorkbenchThemeId;
  name: string;
  isDark: boolean;
  theme: ThemeConfig;
};

function chrome(opts: {
  accent: string;
  activity: string;
  activityFg?: string;
  sidebar: string;
  sidebarFg: string;
  title: string;
  titleFg: string;
  editor: string;
  tabBar: string;
  tabActive: string;
  status: string;
  statusFg?: string;
  hover: string;
  border: string;
  selected: string;
}): ThemeConfig {
  const activityFg = opts.activityFg || "#ffffff";
  return {
    elColorPrimary: opts.accent,
    leftMenuBorderColor: opts.border,
    leftMenuBgColor: opts.sidebar,
    leftMenuBgLightColor: opts.sidebar,
    leftMenuBgActiveColor: opts.selected,
    leftMenuCollapseBgActiveColor: opts.selected,
    leftMenuTextColor: opts.sidebarFg,
    leftMenuTextActiveColor: activityFg,
    logoTitleTextColor: opts.titleFg,
    logoBorderColor: opts.border,
    topHeaderBgColor: opts.title,
    topHeaderTextColor: opts.titleFg,
    topHeaderHoverColor: opts.hover,
    topToolBorderColor: opts.border,
    activityBarBgColor: opts.activity,
    activityBarFgColor: activityFg,
    activityBarInactiveFg: "#ffffff66",
    activityBarActiveBorder: opts.accent,
    statusBarBgColor: opts.status,
    statusBarFgColor: opts.statusFg || "#ffffff",
    editorBgColor: opts.editor,
    tabBarBgColor: opts.tabBar,
    tabActiveBgColor: opts.tabActive,
  };
}

export const DEFAULT_THEME_ID: WorkbenchThemeId = "light-plus";

export const WORKBENCH_THEMES: WorkbenchTheme[] = [
  {
    id: "light-plus",
    name: "Light+",
    isDark: false,
    theme: chrome({
      accent: "#007acc",
      activity: "#2c2c2c",
      sidebar: "#f3f3f3",
      sidebarFg: "#333333",
      title: "#dddddd",
      titleFg: "#333333",
      editor: "#ffffff",
      tabBar: "#ececec",
      tabActive: "#ffffff",
      status: "#007acc",
      hover: "#e8e8e8",
      border: "#e7e7e7",
      selected: "#e4e6f1",
    }),
  },
  {
    id: "dark-plus",
    name: "Dark+",
    isDark: true,
    theme: chrome({
      accent: "#007acc",
      activity: "#333333",
      sidebar: "#252526",
      sidebarFg: "#cccccc",
      title: "#3c3c3c",
      titleFg: "#cccccc",
      editor: "#1e1e1e",
      tabBar: "#2d2d2d",
      tabActive: "#1e1e1e",
      status: "#007acc",
      hover: "#505050",
      border: "#474747",
      selected: "#37373d",
    }),
  },
  {
    id: "monokai",
    name: "Monokai",
    isDark: true,
    theme: chrome({
      accent: "#a6e22e",
      activity: "#1e1f1c",
      sidebar: "#272822",
      sidebarFg: "#f8f8f2",
      title: "#272822",
      titleFg: "#f8f8f2",
      editor: "#272822",
      tabBar: "#1e1f1c",
      tabActive: "#272822",
      status: "#414339",
      hover: "#3e3d32",
      border: "#3e3d32",
      selected: "#414339",
    }),
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    isDark: true,
    theme: chrome({
      accent: "#268bd2",
      activity: "#003847",
      sidebar: "#002b36",
      sidebarFg: "#93a1a1",
      title: "#002b36",
      titleFg: "#93a1a1",
      editor: "#002b36",
      tabBar: "#003847",
      tabActive: "#002b36",
      status: "#00212b",
      hover: "#004454",
      border: "#004454",
      selected: "#005a6f",
    }),
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    isDark: false,
    theme: chrome({
      accent: "#268bd2",
      activity: "#ddd6c1",
      activityFg: "#657b83",
      sidebar: "#eee8d5",
      sidebarFg: "#657b83",
      title: "#eee8d5",
      titleFg: "#657b83",
      editor: "#fdf6e3",
      tabBar: "#eee8d5",
      tabActive: "#fdf6e3",
      status: "#eee8d5",
      statusFg: "#586e75",
      hover: "#e6dfc4",
      border: "#ddd6c1",
      selected: "#dfd9c2",
    }),
  },
  {
    id: "one-dark",
    name: "One Dark Pro",
    isDark: true,
    theme: chrome({
      accent: "#528bff",
      activity: "#21252b",
      sidebar: "#21252b",
      sidebarFg: "#abb2bf",
      title: "#21252b",
      titleFg: "#abb2bf",
      editor: "#282c34",
      tabBar: "#21252b",
      tabActive: "#282c34",
      status: "#21252b",
      hover: "#2c313a",
      border: "#181a1f",
      selected: "#2c313a",
    }),
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    isDark: true,
    theme: chrome({
      accent: "#1f6feb",
      activity: "#010409",
      sidebar: "#0d1117",
      sidebarFg: "#c9d1d9",
      title: "#010409",
      titleFg: "#c9d1d9",
      editor: "#0d1117",
      tabBar: "#010409",
      tabActive: "#0d1117",
      status: "#161b22",
      hover: "#161b22",
      border: "#30363d",
      selected: "#1f2428",
    }),
  },
  {
    id: "quiet-light",
    name: "Quiet Light",
    isDark: false,
    theme: chrome({
      accent: "#705697",
      activity: "#f5f5f5",
      activityFg: "#6c6c6c",
      sidebar: "#f3f3f3",
      sidebarFg: "#333333",
      title: "#c4b7d7",
      titleFg: "#333333",
      editor: "#f5f5f5",
      tabBar: "#e4e4e4",
      tabActive: "#f5f5f5",
      status: "#705697",
      hover: "#e7e7e7",
      border: "#d3d3d3",
      selected: "#c4b7d7",
    }),
  },
];

export function getWorkbenchTheme(id?: string | null) {
  return (
    WORKBENCH_THEMES.find((item) => item.id === id) ||
    WORKBENCH_THEMES.find((item) => item.id === DEFAULT_THEME_ID)!
  );
}
