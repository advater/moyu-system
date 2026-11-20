import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataScopeEnum } from '@/config/constants';
import { isSuperAdmin } from '@/utils/super-admin';
import { PermissionError } from '@/config/error-messages';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { UserRoleRepository } from '@/modules/permission/role/repositories/userRole.repository';
import { RoleRepository } from '@/modules/permission/role/repositories/role.repository';
import { UserRepository } from '@/modules/user/user/repositories/user.repository';
import { DeptRepository } from '@/modules/dept/dept/repositories/dept.repository';
import {
  toDeptDataScopeWhere,
  toUserDataScopeWhere,
  isUserInDataScope,
  isDeptInDataScope,
} from './data-scope.filter';

/** 数据权限计算结果，供列表查询注入 where 条件 */
export interface DataScopeFilter {
  /** true：不限制（全部数据 / 超管） */
  all: boolean;
  /** 仅本人：限制 userId */
  selfUserId?: number;
  /** 允许的部门 ID 集合；空数组表示无可见部门数据 */
  deptIds?: number[];
}

/**
 * 数据权限 Service — 按角色 dataScope 计算可访问的用户/部门范围
 *
 * 多角色取并集：任一角色为 ALL → 不限制；否则合并部门与本人条件。
 */
@Injectable()
export class DataScopeService {
  constructor(
    private readonly userRoleRepository: UserRoleRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly deptRepository: DeptRepository,
  ) {}

  async resolveForUser(loginUser: LoginUser): Promise<DataScopeFilter> {
    if (!loginUser?.id) {
      return { all: false, deptIds: [] };
    }

    const roleIds = await this.userRoleRepository.selectRoleIdsByUserId(
      loginUser.id,
    );
    if (roleIds.length === 0) {
      return { all: false, selfUserId: loginUser.id, deptIds: [] };
    }

    const roles = await this.roleRepository.selectByIds(roleIds);
    const enabled = roles.filter((r) => r.status === 1);
    if (isSuperAdmin(enabled.map((r) => r.code))) {
      return { all: true };
    }
    if (enabled.some((r) => r.dataScope === DataScopeEnum.ALL)) {
      return { all: true };
    }

    const user = await this.userRepository.selectById(loginUser.id);
    const userDeptId = user?.deptId;
    const deptIdSet = new Set<number>();
    let includeSelf = false;

    for (const role of enabled) {
      const scope = role.dataScope ?? DataScopeEnum.SELF;
      if (scope === DataScopeEnum.DEPT_CUSTOM) {
        const custom = Array.isArray(role.dataScopeDeptIds)
          ? role.dataScopeDeptIds
          : [];
        custom.forEach((id) => {
          if (Number.isFinite(id)) deptIdSet.add(Number(id));
        });
      } else if (scope === DataScopeEnum.DEPT_ONLY) {
        if (userDeptId) deptIdSet.add(userDeptId);
      } else if (scope === DataScopeEnum.DEPT_AND_CHILD) {
        if (userDeptId) {
          const ids = await this.collectSubDeptIds(userDeptId);
          ids.forEach((id) => deptIdSet.add(id));
        }
      } else if (scope === DataScopeEnum.SELF) {
        includeSelf = true;
      }
    }

    const filter: DataScopeFilter = { all: false };
    if (deptIdSet.size > 0) {
      filter.deptIds = [...deptIdSet];
    }
    if (includeSelf || (!filter.deptIds && enabled.length > 0)) {
      filter.selfUserId = loginUser.id;
    }
    if (!filter.deptIds && !filter.selfUserId) {
      filter.deptIds = [];
    }
    return filter;
  }

  toUserWhere(filter: DataScopeFilter): Record<string, unknown> | null {
    return toUserDataScopeWhere(filter);
  }

  toDeptWhere(filter: DataScopeFilter): Record<string, unknown> | null {
    return toDeptDataScopeWhere(filter);
  }

  /** 校验目标用户是否在当前操作者数据权限内 */
  async assertUserAccessible(
    loginUser: LoginUser | undefined,
    target: { id: number; deptId?: number | null },
  ): Promise<void> {
    if (!loginUser?.id) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
    const filter = await this.resolveForUser(loginUser);
    if (!isUserInDataScope(filter, target)) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /** 校验目标部门是否在当前操作者数据权限内 */
  async assertDeptAccessible(
    loginUser: LoginUser | undefined,
    deptId: number,
  ): Promise<void> {
    if (!loginUser?.id) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
    const filter = await this.resolveForUser(loginUser);
    if (!isDeptInDataScope(filter, deptId)) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async collectSubDeptIds(rootId: number): Promise<number[]> {
    const all = await this.deptRepository.selectList({});
    const childrenMap = new Map<number, number[]>();
    for (const dept of all) {
      const list = childrenMap.get(dept.parentId) ?? [];
      list.push(dept.id);
      childrenMap.set(dept.parentId, list);
    }
    const result: number[] = [];
    const walk = (id: number) => {
      result.push(id);
      for (const child of childrenMap.get(id) ?? []) {
        walk(child);
      }
    };
    walk(rootId);
    return result;
  }
}
