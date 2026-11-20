import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { TRoute } from "../types";

const NotFound = lazy(() => import("@/views/Error/404"));
const Forbidden = lazy(() => import("@/views/Error/403"));
const Unauthorized = lazy(() => import("@/views/Error/401"));

/** 登录后即可访问（不依赖菜单权限），挂在统一 Layout 下 */
export const constantLayoutChildren: TRoute[] = [
  { index: true, element: <Navigate to="/home" replace /> },
  {
    path: "home",
    name: "home",
    Component: lazy(() => import("@/views/Home")),
    meta: { title: "首页" },
  },
  {
    path: "profile",
    name: "profile",
    Component: lazy(() => import("@/views/Profile")),
    meta: { title: "个人中心" },
  },
  {
    path: "admin/user/notify-message",
    name: "MyNotifyMessage",
    Component: lazy(() => import("@/views/System/notify/my")),
    meta: { title: "我的站内信", hidden: true },
  },
  {
    path: "admin/notify-message",
    name: "MyNotifyMessageAlias",
    Component: lazy(() => import("@/views/System/notify/my")),
    meta: { title: "我的站内信", hidden: true },
  },
  {
    path: "admin/job/job-log",
    name: "SystemJobLog",
    Component: lazy(() => import("@/views/System/job/logger")),
    meta: { title: "调度日志", hidden: true },
  },
  {
    path: "401",
    name: "401",
    Component: Unauthorized,
    meta: { title: "401", hidden: true },
  },
  {
    path: "403",
    name: "403",
    Component: Forbidden,
    meta: { title: "403", hidden: true },
  },
  {
    path: "404",
    name: "404",
    Component: NotFound,
    meta: { title: "404", hidden: true },
  },
];
