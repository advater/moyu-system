import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/stores/app";
import ColorThemePicker from "./ColorThemePicker";
import AccentPicker from "./AccentPicker";
import "./index.scss";

export default function Settings() {
  const { t } = useTranslation();
  const app = useAppStore();

  return (
    <>
      {app.settingOpen ? (
        <div className="vscode-settings-mask" onClick={() => app.setSettingOpen(false)} />
      ) : null}
      <aside className={`vscode-settings ${app.settingOpen ? "is-open" : ""}`}>
        <div className="vscode-settings-header">
          <span>{t("setting.projectSetting")}</span>
          <button type="button" className="vscode-settings-close" onClick={() => app.setSettingOpen(false)}>
            ×
          </button>
        </div>
        <div className="vscode-settings-body">
          <section className="vscode-settings-section">
            <h3>{t("setting.colorTheme")}</h3>
            <ColorThemePicker />
          </section>
          <section className="vscode-settings-section">
            <h3>{t("setting.accentColor")}</h3>
            <AccentPicker />
          </section>
        </div>
      </aside>
    </>
  );
}
