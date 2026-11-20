import { useCallback, useMemo } from "react";
import { usePermissionStore } from "@/store/stores/permission";
import { useUserStore } from "@/store/stores/user";

/**
 * 权限 / 角色校验。未加载完成时一律返回 false，避免无权限内容闪现。
 */
export function usePermission() {
  const { getPermissionActions, getHasLoaded } = usePermissionStore();
  const { getRoles } = useUserStore();

  const permissionSet = useMemo(
    () => (getHasLoaded ? new Set(getPermissionActions) : new Set<string>()),
    [getPermissionActions, getHasLoaded],
  );

  const matchPermission = useCallback(
    (permission: string): boolean => {
      if (permissionSet.has(permission)) return true;
      if (permissionSet.has("*:*:*") || permissionSet.has("*:*") || permissionSet.has("*")) {
        return true;
      }
      const parts = permission.split(":");
      if (parts.length === 3 && parts[0] === "system") {
        return (
          permissionSet.has(`${parts[1]}:${parts[2]}`) ||
          permissionSet.has(`infra:${parts[1]}:${parts[2]}`)
        );
      }
      if (parts.length === 3 && parts[0] === "infra") {
        return permissionSet.has(`system:${parts[1]}:${parts[2]}`);
      }
      if (parts.length === 2) {
        return permissionSet.has(`system:${permission}`) || permissionSet.has(`infra:${permission}`);
      }
      return false;
    },
    [permissionSet],
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permission) return true;
      if (!getHasLoaded) return false;
      const roles = getRoles || [];
      if (roles.includes("super_admin") || roles.includes("*")) return true;
      return matchPermission(permission);
    },
    [matchPermission, getHasLoaded, getRoles],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions || permissions.length === 0) return true;
      if (!getHasLoaded) return false;
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions || permissions.length === 0) return true;
      if (!getHasLoaded) return false;
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!role) return true;
      if (!getHasLoaded) return false;
      const roles = getRoles || [];
      if (roles.includes("super_admin") || roles.includes("admin") || roles.includes("*")) {
        return true;
      }
      return roles.includes(role);
    },
    [getHasLoaded, getRoles],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      if (!roles?.length) return true;
      return roles.some((r) => hasRole(r));
    },
    [hasRole],
  );

  return {
    permissionList: getPermissionActions,
    roles: getRoles,
    hasLoaded: getHasLoaded,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
}
