import type React from "react";
import type { RouteObject } from "react-router-dom";

export type TRoute = RouteObject & {
  path?: string;
  name?: string;
  Component?: React.ComponentType;
  meta?: {
    title?: string;
    tag?: string;
    /** 权限标识，格式为 resource:action，如 "goods:read" */
    permission?: string;
    /** 需与后端菜单 path 匹配，对不上或拒绝访问走 404 */
    menu?: boolean;
    /** 是否隐藏该路由（不在菜单中显示） */
    hidden?: boolean;
    icon?: string;
  };
  isAuth?: boolean;
  redirect?: string;
  children?: TRoute[];
};

export type TPrivateProps = {
  children?: React.ReactNode;
  element?: React.ReactNode;
};