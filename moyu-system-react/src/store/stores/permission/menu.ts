import { joinPath, normalizePath } from "@/utils/tree";
import type { IMenuItem, IPermissionNode } from "@/types/permission";

export function resolvePermissionTree(payload?: unknown): IPermissionNode[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as IPermissionNode[];
  const record = payload as { menus?: IPermissionNode[]; permissionTree?: IPermissionNode[] };
  return record.menus || record.permissionTree || [];
}

export function isRoutableMenu(n: IPermissionNode) {
  if (n.is_menu === 0) return false;
  if (n.type === 3 || n.type === "BUTTON") return false;
  return true;
}

export function isVisibleMenu(n: IPermissionNode) {
  if (!isRoutableMenu(n)) return false;
  if (n.is_show === 0 || n.visible === false) return false;
  return true;
}

export function nodePermission(node: IPermissionNode) {
  return (
    node.permission ||
    (node.resource && node.action ? `${node.resource}:${node.action}` : undefined)
  );
}

export function findRouteMatch(
  nodes: IPermissionNode[] | undefined,
  pathname: string,
  parentPath = "",
): { node: IPermissionNode; path: string } | null {
  const current = normalizePath(pathname);
  const sorted = [...(nodes || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  for (const node of sorted) {
    if (!isRoutableMenu(node)) continue;
    const path = normalizePath(joinPath(parentPath, node.path));
    if (path === current) return { node, path };
    if (node.children?.length) {
      const hit = findRouteMatch(node.children, pathname, path);
      if (hit) return hit;
    }
  }
  return null;
}

export function buildMenuList(nodes: IPermissionNode[], parentPath = ""): IMenuItem[] {
  return (nodes || [])
    .filter(isVisibleMenu)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((n) => {
      const path = normalizePath(joinPath(parentPath, n.path));
      const item: IMenuItem = {
        title: n.title || n.name || "",
        path,
        icon: n.icon || undefined,
      };
      if (n.children?.length) {
        const children = buildMenuList(n.children, path);
        if (children.length) item.children = children;
      }
      return item;
    });
}

/** 从权限树提取所有权限标识 */
export function flattenPermissionActions(nodes: IPermissionNode[]): Set<string> {
  const result = new Set<string>();
  function walk(list: IPermissionNode[]) {
    for (const node of list || []) {
      if (node.permission) result.add(node.permission);
      if (node.resource && node.action) result.add(`${node.resource}:${node.action}`);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

export function findMenuTitle(items: IMenuItem[], path: string): string {
  const trail = findMenuTrail(items, path);
  return trail.at(-1)?.title || "";
}

export function findMenuTrail(items: IMenuItem[], path: string): IMenuItem[] {
  const current = normalizePath(path);
  for (const item of items) {
    const itemPath = normalizePath(item.path);
    if (itemPath === current) return [item];
    if (item.children?.length) {
      const childTrail = findMenuTrail(item.children, current);
      if (childTrail.length) return [item, ...childTrail];
    }
  }
  return [];
}

export function findAncestorPaths(items: IMenuItem[], path: string): string[] {
  return findMenuTrail(items, path)
    .slice(0, -1)
    .map((item) => item.path)
    .filter(Boolean);
}
