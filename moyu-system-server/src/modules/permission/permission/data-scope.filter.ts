import type { DataScopeFilter } from '@/modules/permission/permission/data-scope.service';

/** 将数据范围转为用户表 where 片段（纯函数，便于单测） */
export function toUserDataScopeWhere(
  filter: DataScopeFilter,
): Record<string, unknown> | null {
  if (filter.all) return null;
  const parts: Record<string, unknown>[] = [];
  if (filter.deptIds && filter.deptIds.length > 0) {
    parts.push({ deptId: { in: filter.deptIds } });
  }
  if (filter.selfUserId) {
    parts.push({ id: filter.selfUserId });
  }
  if (parts.length === 0) {
    return { id: -1 };
  }
  if (parts.length === 1) return parts[0];
  return { OR: parts };
}

/** 将数据范围转为部门表 where 片段 */
export function toDeptDataScopeWhere(
  filter: DataScopeFilter,
): Record<string, unknown> | null {
  if (filter.all) return null;
  if (filter.deptIds && filter.deptIds.length > 0) {
    return { id: { in: filter.deptIds } };
  }
  return { id: -1 };
}

/** 单条用户是否在数据权限范围内 */
export function isUserInDataScope(
  filter: DataScopeFilter,
  user: { id: number; deptId?: number | null },
): boolean {
  if (filter.all) return true;
  if (filter.selfUserId != null && user.id === filter.selfUserId) return true;
  if (
    filter.deptIds &&
    user.deptId != null &&
    filter.deptIds.includes(user.deptId)
  ) {
    return true;
  }
  return false;
}

/** 单条部门是否在数据权限范围内 */
export function isDeptInDataScope(
  filter: DataScopeFilter,
  deptId: number,
): boolean {
  if (filter.all) return true;
  return !!filter.deptIds?.includes(deptId);
}
