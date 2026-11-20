import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/stores/app";
import { usePermissionStore } from "@/store/stores/permission";
import { findMenuTitle } from "@/store/stores/permission/menu";
import { useLocaleStore } from "@/store/stores/locale";
import "./index.scss";

export default function StatusBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { footer, title, colorTheme, currentSize } = useAppStore();
  const { lang } = useLocaleStore();
  const { getMenuList } = usePermissionStore();

  if (!footer) return null;

  const page =
    findMenuTitle(getMenuList || [], location.pathname) ||
    (location.pathname === "/home" ? t("router.home") : location.pathname);

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <span>{title}</span>
        <span className="status-bar-sep">|</span>
        <span>{page}</span>
      </div>
      <div className="status-bar-right">
        <span>{colorTheme}</span>
        <span>{lang}</span>
        <span>{currentSize}</span>
      </div>
    </footer>
  );
}
