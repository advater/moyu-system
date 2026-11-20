import {
  toDeptDataScopeWhere,
  toUserDataScopeWhere,
  isUserInDataScope,
  isDeptInDataScope,
} from './data-scope.filter';

describe('data-scope.filter', () => {
  it('ALL 返回 null（不过滤）', () => {
    expect(toUserDataScopeWhere({ all: true })).toBeNull();
    expect(toDeptDataScopeWhere({ all: true })).toBeNull();
  });

  it('仅本人', () => {
    expect(toUserDataScopeWhere({ all: false, selfUserId: 7 })).toEqual({
      id: 7,
    });
  });

  it('仅部门', () => {
    expect(
      toUserDataScopeWhere({ all: false, deptIds: [1, 2] }),
    ).toEqual({ deptId: { in: [1, 2] } });
  });

  it('部门 + 本人用 OR', () => {
    expect(
      toUserDataScopeWhere({
        all: false,
        deptIds: [3],
        selfUserId: 9,
      }),
    ).toEqual({
      OR: [{ deptId: { in: [3] } }, { id: 9 }],
    });
  });

  it('无范围时用户强制空结果', () => {
    expect(toUserDataScopeWhere({ all: false })).toEqual({ id: -1 });
  });

  it('部门范围过滤', () => {
    expect(
      toDeptDataScopeWhere({ all: false, deptIds: [10, 11] }),
    ).toEqual({ id: { in: [10, 11] } });
  });

  it('无部门范围时部门强制空结果', () => {
    expect(toDeptDataScopeWhere({ all: false, selfUserId: 1 })).toEqual({
      id: -1,
    });
  });

  it('isUserInDataScope / isDeptInDataScope', () => {
    expect(isUserInDataScope({ all: true }, { id: 1 })).toBe(true);
    expect(
      isUserInDataScope({ all: false, selfUserId: 2 }, { id: 2, deptId: 9 }),
    ).toBe(true);
    expect(
      isUserInDataScope({ all: false, deptIds: [3] }, { id: 1, deptId: 3 }),
    ).toBe(true);
    expect(
      isUserInDataScope({ all: false, deptIds: [3] }, { id: 1, deptId: 4 }),
    ).toBe(false);
    expect(isDeptInDataScope({ all: false, deptIds: [8] }, 8)).toBe(true);
    expect(isDeptInDataScope({ all: false, deptIds: [8] }, 9)).toBe(false);
  });
});
