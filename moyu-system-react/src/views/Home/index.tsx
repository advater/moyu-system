import { Link } from "react-router-dom";
import { Card } from "antd";
import { useTranslation } from "react-i18next";
import { usePermissionStore } from "@/store/stores/permission";
import "./index.scss";

function firstLeafPath(item: { path?: string; children?: any[] }): string {
  if (item.children?.length) return firstLeafPath(item.children[0]);
  return item.path || "/home";
}

export default function Home() {
  const { t } = useTranslation();
  const { getMenuList } = usePermissionStore();
  const groups = getMenuList || [];

  return (
    <section className="home-page">
      <Card title={t("router.workplace")} variant="borderless">
        <p className="home-desc">{t("login.message")}</p>
        <div className="home-links">
          {groups.map((group: any) => (
            <Link key={group.path || group.title} to={firstLeafPath(group)}>
              {group.title}
            </Link>
          ))}
        </div>
      </Card>
    </section>
  );
}
