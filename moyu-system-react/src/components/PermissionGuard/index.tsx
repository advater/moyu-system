import type React from "react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGuardProps {
  /** 需要的权限标识，格式 resource:action */
  permission: string | string[];
  /** 权限模式：AND 需要全部权限，OR 只需任一权限，默认 AND */
  mode?: "AND" | "OR";
  children: React.ReactNode;
  /** 无权限时的回退内容，默认不渲染 */
  fallback?: React.ReactNode;
  /**
   * 权限未加载完成时的行为：
   * - "loading" (默认)：渲染 fallback 或 null，等待权限加载
   * - "show"：直接渲染子组件（适用于不敏感的内容区域）
   */
  loadingBehavior?: "loading" | "show";
}

/**
 * 权限守卫组件 — 根据权限控制子元素的渲染
 *
 * 与 PrivateRoute 和 usePermission Hook 保持一致的权限判断逻辑：
 * - 权限数据未加载完成时默认不渲染子组件（loading 模式），避免无权限内容闪现
 * - 可通过 loadingBehavior="show" 覆盖此行为
 *
 * 用法：
 *   <PermissionGuard permission="goods:create">
 *     <Button>新增商品</Button>
 *   </PermissionGuard>
 *
 *   <PermissionGuard permission={["goods:read", "goods:export"]} mode="OR">
 *     <Button>导出</Button>
 *   </PermissionGuard>
 *
 *   <PermissionGuard permission="goods:delete" fallback={<Button disabled>删除</Button>}>
 *     <Button>删除</Button>
 *   </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  mode = "AND",
  children,
  fallback = null,
  loadingBehavior = "loading",
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasLoaded } = usePermission();

  // 权限数据未加载完成时的处理
  if (!hasLoaded) {
    return loadingBehavior === "show" ? <>{children}</> : <>{fallback}</>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];

  const authorized =
    mode === "OR"
      ? hasAnyPermission(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAllPermissions(permissions);

  return authorized ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;