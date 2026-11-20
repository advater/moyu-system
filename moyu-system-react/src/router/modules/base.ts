import { lazy } from "react";
import type { TRoute } from "../types";

/** 无需登录 */
export const baseRoutes: TRoute[] = [
  { path: "/login", name: "login", Component: lazy(() => import("@/views/Auth/login")) },
  { path: "/register", name: "register", Component: lazy(() => import("@/views/Auth/register")) },
  { path: "/password", name: "password", Component: lazy(() => import("@/views/Auth/password")) },
];
