import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/stores/app";
import { usePermissionStore } from "@/store/stores/permission";
import { findMenuTrail } from "@/store/stores/permission/menu";

export default function HeaderBreadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();
  const { breadcrumb } = useAppStore();
  const { getMenuList } = usePermissionStore();

  if (!breadcrumb) return null;

  const trail = findMenuTrail(getMenuList || [], location.pathname);
  const items = [
    { title: <Link to="/home">{t("router.home")}</Link> },
    ...trail
      .filter((item) => item.path !== "/home")
      .map((item, index, arr) => {
        const isLast = index === arr.length - 1;
        return {
          title: isLast ? (
            item.title
          ) : (
            <Link to={item.path}>{item.title}</Link>
          ),
        };
      }),
  ];

  return <Breadcrumb className="header-breadcrumb" items={items} />;
}
