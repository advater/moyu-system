export function setCssVar(key: string, value?: string) {
  if (value == null) return;
  document.documentElement.style.setProperty(key, value);
}

export function humpToUnderline(str: string) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function applyThemeVars(theme: Record<string, string>) {
  Object.entries(theme).forEach(([key, value]) => {
    setCssVar(`--${humpToUnderline(key)}`, value);
  });
}
