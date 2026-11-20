import { SettingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/stores/app";

export default function SettingButton() {
  const { t } = useTranslation();
  const { setSettingOpen } = useAppStore();
  return (
    <button
      type="button"
      className="header-icon-btn"
      title={t("setting.projectSetting")}
      onClick={() => setSettingOpen(true)}
    >
      <SettingOutlined />
    </button>
  );
}
