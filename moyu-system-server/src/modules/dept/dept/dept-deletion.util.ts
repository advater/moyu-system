/** 删部门前的引用阻塞原因（与 DeptError 键对齐） */
export type DeptDeletionBlocker =
  | 'HAS_CHILDREN'
  | 'HAS_USERS'
  | 'IN_DATA_SCOPE';

/**
 * 部门删除引用检查（纯函数）。优先级：子部门 > 下属用户 > 角色 dataScope 引用。
 */
export function resolveDeptDeletionBlocker(input: {
  hasChildren: boolean;
  userCount: number;
  referencedByRole: boolean;
}): DeptDeletionBlocker | null {
  if (input.hasChildren) return 'HAS_CHILDREN';
  if (input.userCount > 0) return 'HAS_USERS';
  if (input.referencedByRole) return 'IN_DATA_SCOPE';
  return null;
}

export function roleReferencesDept(
  dataScopeDeptIds: unknown,
  deptId: number,
): boolean {
  return (
    Array.isArray(dataScopeDeptIds) &&
    dataScopeDeptIds.map(Number).includes(deptId)
  );
}
