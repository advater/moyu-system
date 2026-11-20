import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "antd";
import type { MenuProps } from "antd";
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
import { findAncestorPaths } from "@/store/stores/permission/menu";
import { useAppStore } from "@/store/stores/app";
import { HOME_PATH, useTagsViewStore } from "@/store/stores/tagsView";
import { colorIsDark } from "@/utils/color";
import { normalizePath } from "@/utils/tree";
import type { IMenuItem } from "@/types/permission";
import "./index.scss";

type MenuItem = Required<MenuProps>["items"][number];

function firstLeafPath(node: IMenuItem): string {
  if (node.children?.length) return firstLeafPath(node.children[0]);
  return node.path;
}

function findNode(nodes: IMenuItem[], key: string): IMenuItem | undefined {
  for (const node of nodes) {
    if (node.path === key) return node;
    if (node.children?.length) {
      const hit = findNode(node.children, key);
      if (hit) return hit;
    }
  }
}

function menuIcon(item: IMenuItem) {
  const key = `${item.path || ""} ${item.title || ""}`.toLowerCase();
  if (key.includes("home") || key.includes("首页")) return HomeOutlined;
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

function toMenuItems(nodes: IMenuItem[], depth = 0): MenuItem[] {
  return nodes.map((node) => {
    const key = node.path || node.title;
    const Icon = menuIcon(node);
    const item: MenuItem = {
      key,
      label: node.title,
      icon: depth === 0 ? <Icon /> : undefined,
    };
    if (node.children?.length) {
      return { ...item, children: toMenuItems(node.children, depth + 1) };
    }
    return item;
  });
}

export default function SiderBarNav({ nodes }: { nodes?: IMenuItem[] }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { getMenuList } = usePermissionStore();
  const { uniqueOpened, theme } = useAppStore();
  const { refreshTag } = useTagsViewStore();
  const currentPath = normalizePath(location.pathname);
  const source = nodes || ((getMenuList || []) as IMenuItem[]);
  const menuData = useMemo<IMenuItem[]>(() => {
    const rest = source.filter((item) => item.path !== "/home");
    return [{ title: t("router.home"), path: "/home" }, ...rest];
  }, [source, t]);
  const darkMenu = colorIsDark(theme.leftMenuBgColor);

  const items = useMemo(() => toMenuItems(menuData), [menuData]);
  const [openKeys, setOpenKeys] = useState<string[]>(() => findAncestorPaths(menuData, currentPath));

  useEffect(() => {
    setOpenKeys(findAncestorPaths(menuData, currentPath));
  }, [currentPath, menuData, uniqueOpened]);

  const handleOpenChange: MenuProps["onOpenChange"] = (keys) => {
    if (!uniqueOpened) {
      setOpenKeys(keys);
      return;
    }
    const latest = keys.find((key) => !openKeys.includes(key));
    if (!latest) {
      setOpenKeys(keys);
      return;
    }
    const ancestors = findAncestorPaths(menuData, latest);
    setOpenKeys([...ancestors, latest]);
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key !== "string" || !key.startsWith("/")) return;
    const node = findNode(menuData, key);
    const path = node ? firstLeafPath(node) : key;
    if (path === currentPath) {
      if (path !== HOME_PATH) refreshTag(path);
      return;
    }
    navigate(path);
  };

  return (
    <Menu
      items={items}
      className="sider-bar"
      mode="inline"
      theme={darkMenu ? "dark" : "light"}
      inlineIndent={24}
      selectedKeys={[currentPath]}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      onClick={handleMenuClick}
    />
  );
}
