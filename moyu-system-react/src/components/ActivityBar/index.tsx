import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tooltip } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  HomeOutlined,
  PayCircleOutlined,
  RobotOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePermissionStore } from "@/store/stores/permission";
import { useAppStore } from "@/store/stores/app";
import { normalizePath } from "@/utils/tree";
import type { IMenuItem } from "@/types/permission";
import "./index.scss";

function firstLeafPath(node: IMenuItem): string {
  if (node.children?.length) return firstLeafPath(node.children[0]);
  return node.path || "/home";
}

export function findRootMenu(nodes: IMenuItem[], path: string): IMenuItem | undefined {
  const current = normalizePath(path);
  return nodes.find((node) => {
    const p = normalizePath(node.path);
    return current === p || current.startsWith(`${p}/`);
  });
}

function menuIcon(item: IMenuItem) {
  const key = `${item.path || ""} ${item.title || ""}`.toLowerCase();
  if (key.includes("infra") || key.includes("基础设施")) return SettingOutlined;
  if (key.includes("system") || key.includes("系统")) return SettingOutlined;
  if (key.includes("user") || key.includes("用户")) return UserOutlined;
  if (key.includes("pay") || key.includes("支付")) return PayCircleOutlined;
  if (key.includes("bpm") || key.includes("流程")) return PartitionOutlined;
  if (key.includes("member") || key.includes("会员")) return TeamOutlined;
  if (key.includes("mall") || key.includes("商城")) return ShoppingOutlined;
  if (key.includes("report") || key.includes("报表")) return BarChartOutlined;
  if (key.includes("ai")) return RobotOutlined;
  return AppstoreOutlined;
}

export default function ActivityBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { getMenuList } = usePermissionStore();
  const { collapse, setCollapse, setSettingOpen } = useAppStore();
  const menus = (getMenuList || []) as IMenuItem[];
  const current = normalizePath(location.pathname);
  const activeRoot = findRootMenu(menus, current);
  const homeActive = current === "/home" || current === "/profile" || !activeRoot;

  const items = useMemo(
    () => [
      { key: "home", title: t("router.home"), Icon: HomeOutlined, path: "/home" },
      ...menus.map((item) => ({
        key: item.path,
        title: item.title,
        Icon: menuIcon(item),
        path: firstLeafPath(item),
      })),
    ],
    [menus, t],
  );

  const select = (key: string, path: string) => {
    const isActive = key === "home" ? homeActive : activeRoot?.path === key;
    if (isActive && !collapse) {
      setCollapse(true);
      return;
    }
    setCollapse(false);
    navigate(path);
  };

  return (
    <nav className="activity-bar">
      <div className="activity-bar-top">
        {items.map((item) => {
          const active = item.key === "home" ? homeActive : activeRoot?.path === item.key;
          return (
            <Tooltip key={item.key} title={item.title} placement="right">
              <button
                type="button"
                className={`activity-bar-item ${active ? "is-active" : ""}`}
                onClick={() => select(item.key, item.path)}
              >
                <item.Icon />
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div className="activity-bar-bottom">
        <Tooltip title={t("setting.projectSetting")} placement="right">
          <button type="button" className="activity-bar-item" onClick={() => setSettingOpen(true)}>
            <SettingOutlined />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
