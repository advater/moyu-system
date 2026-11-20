/** 内置管理员账号：禁止关闭状态 / 删除 */
export const ADMIN_USERNAME = "admin";

/** 系统管理目录：自身及子菜单禁止改状态 */
export const SYSTEM_MENU_ROOT_PATH = "/admin";
export const SYSTEM_MENU_ROOT_NAME = "系统管理";

export function isProtectedAdminUser(username?: string | null) {
  return (username || "").toLowerCase() === ADMIN_USERNAME;
}

export function isSystemManageRoot(menu: {
  id?: number;
  path?: string;
  name?: string;
  parentId?: number;
}) {
  if (menu.id === 1) return true;
  if (menu.path === SYSTEM_MENU_ROOT_PATH) return true;
  return menu.parentId === 0 && menu.name === SYSTEM_MENU_ROOT_NAME;
}

export function markSystemManageStatusLocked<T extends { children?: T[]; id?: number; path?: string; name?: string; parentId?: number }>(
  nodes: T[],
  locked = false,
): Array<T & { statusLocked?: boolean }> {
  return nodes.map((node) => {
    const next = locked || isSystemManageRoot(node);
    const children = node.children?.length
      ? markSystemManageStatusLocked(node.children, next)
      : node.children;
    return { ...node, statusLocked: next, children };
  });
}

export function isMenuStatusLocked(
  id: number | undefined,
  tree: Array<{ id?: number; children?: any[] }>,
): boolean {
  if (id == null) return false;
  const stack = tree.map((node) => ({
    node,
    locked: isSystemManageRoot(node),
  }));
  while (stack.length) {
    const { node, locked } = stack.pop()!;
    const next = locked || isSystemManageRoot(node);
    if (node.id === id) return next;
    for (const child of node.children || []) {
      stack.push({ node: child, locked: next });
    }
  }
  return false;
}
