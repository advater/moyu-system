import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SiderBarNav from "@/components/SiderBarNav";
import TagsView from "@/components/TagsView";
import KeepAliveOutlet from "@/components/KeepAliveOutlet";
import Settings from "@/components/Settings";
import TenantSelectModal from "@/components/TenantSelectModal";
import { useAppStore } from "@/store/stores/app";
import { usePermissionStore } from "@/store/stores/permission";
import { findMenuTitle } from "@/store/stores/permission/menu";
import { env } from "@/config/env";
import { getMustChangePassword } from "@/utils/mustChangePassword";
import TenantListener from "./TenantListener";
import "./index.scss";

export default function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { collapse, tagsView } = useAppStore();
  const { getMenuList } = usePermissionStore();
  const menus = getMenuList || [];

  useEffect(() => {
    const errorTitle = ["/401", "/403", "/404"].includes(location.pathname)
      ? location.pathname.slice(1)
      : "";
    const pageTitle =
      findMenuTitle(menus, location.pathname) ||
      (location.pathname === "/home" ? t("router.home") : "") ||
      errorTitle;
    document.title = pageTitle ? `${pageTitle} - ${env.title}` : env.title;
  }, [menus, location.pathname, t]);

  if (getMustChangePassword() && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <section className="app-layout">
      <Header />
      <div className="app-layout-workspace">
        {collapse ? null : (
          <aside className="app-layout-aside">
            <SiderBarNav nodes={menus} />
          </aside>
        )}
        <div className="app-layout-main">
          {tagsView ? <TagsView /> : null}
          <div className="app-layout-body">
            <KeepAliveOutlet />
          </div>
        </div>
      </div>
      <Settings />
      <TenantListener />
      <TenantSelectModal />
    </section>
  );
}
