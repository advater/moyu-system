import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import type { TPrivateProps } from "./types";
import Token from "@/utils/token";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionStore } from "@/store/stores/permission";
import { findRouteMatch, nodePermission } from "@/store/stores/permission/menu";

export const PrivateRoute = (props: TPrivateProps & { permission?: string }) => {
  const { element, permission } = props;
  const location = useLocation();
  const authToken = Token.getToken();
  const { hasPermission, hasLoaded } = usePermission();

  if (!authToken) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (permission) {
    if (!hasLoaded) return <div style={{ padding: 24, textAlign: "center" }}>加载权限中...</div>;
    if (!hasPermission(permission)) {
      return <Navigate to="/404" replace />;
    }
  }

  return <>{element}</>;
};

/** 业务页：URL 必须能在后端菜单树里匹配，否则 404 */
export const MenuRoute = ({ element }: { element: ReactNode }) => {
  const location = useLocation();
  const { getPermissionTree, getHasLoaded } = usePermissionStore();
  const { hasPermission } = usePermission();

  if (!getHasLoaded) {
    return <div style={{ padding: 24, textAlign: "center" }}>加载权限中...</div>;
  }

  const match = findRouteMatch(getPermissionTree, location.pathname);
  if (!match) {
    return <Navigate to="/404" replace />;
  }

  const permission = nodePermission(match.node);
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/404" replace />;
  }

  return <>{element}</>;
};
