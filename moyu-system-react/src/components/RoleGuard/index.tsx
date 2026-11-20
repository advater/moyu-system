import type React from "react";
import { usePermission } from "@/hooks/usePermission";

export default function RoleGuard({
  role,
  children,
  fallback = null,
}: {
  role: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole, hasAnyRole, hasLoaded } = usePermission();
  if (!hasLoaded) return <>{fallback}</>;
  const roles = Array.isArray(role) ? role : [role];
  const ok = roles.length === 1 ? hasRole(roles[0]) : hasAnyRole(roles);
  return ok ? <>{children}</> : <>{fallback}</>;
}
