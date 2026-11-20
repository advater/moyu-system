import {
  resolveDeptDeletionBlocker,
  roleReferencesDept,
} from './dept-deletion.util';

describe('resolveDeptDeletionBlocker', () => {
  it('子部门优先', () => {
    expect(
      resolveDeptDeletionBlocker({
        hasChildren: true,
        userCount: 3,
        referencedByRole: true,
      }),
    ).toBe('HAS_CHILDREN');
  });

  it('有下属用户', () => {
    expect(
      resolveDeptDeletionBlocker({
        hasChildren: false,
        userCount: 1,
        referencedByRole: true,
      }),
    ).toBe('HAS_USERS');
  });

  it('角色 dataScope 引用', () => {
    expect(
      resolveDeptDeletionBlocker({
        hasChildren: false,
        userCount: 0,
        referencedByRole: true,
      }),
    ).toBe('IN_DATA_SCOPE');
  });

  it('无引用可删', () => {
    expect(
      resolveDeptDeletionBlocker({
        hasChildren: false,
        userCount: 0,
        referencedByRole: false,
      }),
    ).toBeNull();
  });

  it('roleReferencesDept', () => {
    expect(roleReferencesDept([1, '12'], 12)).toBe(true);
    expect(roleReferencesDept([1], 12)).toBe(false);
    expect(roleReferencesDept(null, 1)).toBe(false);
  });
});
