import { useAppStore } from "@/store/stores/app";
import { WORKBENCH_THEMES } from "@/config/workbenchThemes";
import "./ColorThemePicker.scss";

function canvasColor(isDark: boolean) {
  return isDark ? "#141414" : "#f5f6f8";
}

export default function ColorThemePicker() {
  const { colorTheme, setColorTheme } = useAppStore();

  return (
    <div className="color-theme-picker">
      {WORKBENCH_THEMES.map((item) => {
        const canvas = canvasColor(item.isDark);
        const panel = item.theme.editorBgColor;
        const accent = item.theme.elColorPrimary;
        const selected = `color-mix(in srgb, ${accent} 22%, ${panel})`;
        return (
          <button
            key={item.id}
            type="button"
            className={`color-theme-item ${colorTheme === item.id ? "is-active" : ""}`}
            onClick={() => setColorTheme(item.id)}
          >
            <span
              className="color-theme-preview"
              style={{
                background: canvas,
                borderColor: item.isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)",
              }}
            >
              <span className="p-header">
                <i className="p-logo" style={{ background: accent }} />
              </span>
              <span className="p-workspace">
                <span className="p-side" style={{ background: panel }}>
                  <i className="p-menu" style={{ background: selected }} />
                  <i className="p-menu is-muted" />
                  <i className="p-menu is-muted" />
                </span>
                <span className="p-content" style={{ background: panel }}>
                  <i className="p-tab" style={{ background: selected }} />
                </span>
              </span>
            </span>
            <span className="color-theme-name">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
