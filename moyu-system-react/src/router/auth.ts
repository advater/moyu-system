import { resolveRouterBasename } from "@/config/env";
import { baseRoutes } from "./modules/base";

export const AUTH_PATHS = baseRoutes
  .map((item) => item.path)
  .filter((path): path is string => Boolean(path));

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.includes(pathname);
}

/** 去掉 Router basename 后的路径，便于和 AUTH_PATHS 对齐 */
export function getAppPathname(pathname = typeof window === "undefined" ? "/" : window.location.pathname) {
  const basename = resolveRouterBasename() || "";
  if (basename && (pathname === basename || pathname.startsWith(`${basename}/`))) {
    const rest = pathname.slice(basename.length);
    return rest ? (rest.startsWith("/") ? rest : `/${rest}`) : "/";
  }
  return pathname;
}

/** 当前是否在登录/注册/找回密码等无需会话的页面 */
export function isCurrentAuthPath() {
  if (typeof window === "undefined") return false;
  return isAuthPath(getAppPathname());
}
