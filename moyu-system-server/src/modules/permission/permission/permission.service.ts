import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  PermissionAssignRoleDataScopeReqDTO,
  PermissionAssignRoleMenuReqDTO,
  PermissionAssignUserRoleReqDTO,
} from './dto/permission.dto';
import { RoleRepository } from '../role/repositories/role.repository';
import { RoleMenuRepository } from '../role/repositories/roleMenu.repository';
import { UserRoleRepository } from '../role/repositories/userRole.repository';
import { UserRepository } from '../../user/user/repositories/user.repository';
import { MenuRepository } from '../menu/repositories/menu.repository';
import { PermissionError, RoleError, UserError } from '@/config/error-messages';
import {
  PERMISSION_BUNDLE_CACHE_PREFIX,
  PERMISSION_BUNDLE_CACHE_TTL_MS,
  DEFAULT_TENANT_ID,
} from '@/config/constants';
import { isSuperAdmin } from '@/utils/super-admin';
import { DataScopeService } from './data-scope.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { RedisService } from '@/plugins/redis/redis.service';
import { TenantContext } from '@/common/tenant/tenant.context';

/** 用户访问控制快照（角色码 + 权限码） */
export interface UserAccessBundle {
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

/**
 * 权限分配 Service
 *
 * 覆盖三大分配事务 + 鉴权用 getUserAccessBundle（Redis 短缓存）。
 */
@Injectable()
export class PermissionService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly userRepository: UserRepository,
    private readonly menuRepository: MenuRepository,
    private readonly dataScopeService: DataScopeService,
    private readonly redisService: RedisService,
  ) {}

  private bundleCacheKey(tenantId: string, userId: number): string {
    return `${PERMISSION_BUNDLE_CACHE_PREFIX}:${tenantId}:${userId}`;
  }

  private currentTenantId(): string {
    return TenantContext.getTenantId() || DEFAULT_TENANT_ID;
  }

  /** 赋权后使当前租户下权限缓存失效 */
  private async invalidateTenantBundles(): Promise<void> {
    const tenantId = this.currentTenantId();
    await this.redisService.deleteByPattern(
      `${PERMISSION_BUNDLE_CACHE_PREFIX}:${tenantId}:*`,
    );
  }

  private async invalidateUserBundle(userId: number): Promise<void> {
    await this.redisService.delete(
      this.bundleCacheKey(this.currentTenantId(), userId),
    );
  }

  /**
   * 递增用户权限版本号：赋权变更后使已签发令牌立即失效（需重新登录或刷新令牌）
   */
  private async bumpPermVersion(userIds: number[]): Promise<void> {
    const uniq = [...new Set(userIds)];
    if (uniq.length === 0) return;
    await this.userRepository.incrementPermVersionByIds(uniq);
  }

  /** 递增指定角色下所有用户的权限版本号 */
  private async bumpPermVersionByRole(roleId: number): Promise<void> {
    await this.bumpPermVersion(
      await this.userRepository.selectUserIdsByRoleId(roleId),
    );
  }

  /**
   * 加载用户启用中的角色码与按钮权限码（与 getPermissionInfo 规则一致）
   */
  async getUserAccessBundle(userId: number): Promise<UserAccessBundle> {
    const tenantId = this.currentTenantId();
    const cacheKey = this.bundleCacheKey(tenantId, userId);
    const cached = await this.redisService.get<UserAccessBundle>(cacheKey);
    if (
      cached &&
      Array.isArray(cached.roles) &&
      Array.isArray(cached.permissions)
    ) {
      return cached;
    }

    const bundle = await this.loadUserAccessBundle(userId);
    await this.redisService.set(
      cacheKey,
      bundle,
      PERMISSION_BUNDLE_CACHE_TTL_MS,
    );
    return bundle;
  }

  private async loadUserAccessBundle(
    userId: number,
  ): Promise<UserAccessBundle> {
    const roleIds = await this.userRoleRepository.selectRoleIdsByUserId(userId);
    const roleList = roleIds.length
      ? await this.roleRepository.selectByIds(roleIds)
      : [];
    const enabledRoles = roleList.filter((role) => role.status === 1);
    const roles = enabledRoles.map((role) => role.code);
    const superAdmin = isSuperAdmin(roles);

    if (superAdmin) {
      const menus = await this.menuRepository.selectList({ status: 1 });
      const permissions = [
        ...new Set(
          menus
            .filter((menu) => menu.type === 3 && menu.permission)
            .map((menu) => menu.permission!),
        ),
      ];
      return { roles, permissions, isSuperAdmin: true };
    }

    const menuIdSet = new Set<number>();
    for (const role of enabledRoles) {
      const ids = await this.roleMenuRepository.selectMenuIdsByRoleId(role.id);
      ids.forEach((id) => menuIdSet.add(id));
    }
    const menus = menuIdSet.size
      ? (await this.menuRepository.selectByIds([...menuIdSet])).filter(
          (menu) => menu.status === 1,
        )
      : [];
    const permissions = [
      ...new Set(
        menus
          .filter((menu) => menu.type === 3 && menu.permission)
          .map((menu) => menu.permission!),
      ),
    ];
    return { roles, permissions, isSuperAdmin: false };
  }

  async getRoleMenuList(roleId: string): Promise<number[]> {
    const id = this.parseId(roleId, RoleError.ID_REQUIRED);
    const role = await this.roleRepository.selectById(id);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.roleMenuRepository.selectMenuIdsByRoleId(id);
  }

  async assignRoleMenu(
    req: PermissionAssignRoleMenuReqDTO,
  ): Promise<boolean> {
    const role = await this.roleRepository.selectById(req.roleId);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const menuIds = req.menuIds ?? [];
    if (menuIds.length > 0) {
      const menus = await this.menuRepository.selectByIds(menuIds);
      if (menus.length !== new Set(menuIds).size) {
        throw new HttpException(
          PermissionError.NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    await this.roleMenuRepository.replaceRoleMenus(
      req.roleId,
      role.tenantId,
      menuIds,
    );
    await this.invalidateTenantBundles();
    // 角色菜单变更：递增该角色下用户的权限版本，旧令牌立即失效
    await this.bumpPermVersionByRole(req.roleId);
    return true;
  }

  async assignRoleDataScope(
    req: PermissionAssignRoleDataScopeReqDTO,
  ): Promise<boolean> {
    const role = await this.roleRepository.selectById(req.roleId);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const updated = await this.roleRepository.updateById(req.roleId, {
      dataScope: req.dataScope,
      dataScopeDeptIds: req.dataScopeDeptIds ?? [],
    });
    // 数据权限变更：递增该角色下用户的权限版本，旧令牌立即失效
    await this.bumpPermVersionByRole(req.roleId);
    return updated;
  }

  async listAdminRoles(
    userId: string,
    loginUser?: LoginUser,
  ): Promise<number[]> {
    const id = this.parseId(userId, UserError.ID_REQUIRED);
    const user = await this.userRepository.selectById(id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    return this.userRoleRepository.selectRoleIdsByUserId(id);
  }

  async assignUserRole(
    req: PermissionAssignUserRoleReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const user = await this.userRepository.selectById(req.userId);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    const roleIds = req.roleIds ?? [];
    let assignsSuper = false;
    if (roleIds.length > 0) {
      const roles = await this.roleRepository.selectByIds(roleIds);
      if (roles.length !== new Set(roleIds).size) {
        throw new HttpException(
          RoleError.NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      assignsSuper = isSuperAdmin(roles.map((r) => r.code));
      if (assignsSuper && !isSuperAdmin(loginUser?.roles)) {
        throw new HttpException(
          PermissionError.INSUFFICIENT_PERMISSIONS,
          HttpStatus.FORBIDDEN,
        );
      }
    }
    // 自我操作护栏：不允许移除自己的超管角色（防自锁）
    if (
      req.userId === loginUser?.id &&
      isSuperAdmin(loginUser?.roles) &&
      !assignsSuper
    ) {
      throw new HttpException(
        UserError.CANNOT_OPERATE_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userRoleRepository.replaceUserRoles(req.userId, roleIds);
    await this.invalidateUserBundle(req.userId);
    // 用户角色变更：递增该用户权限版本，旧令牌立即失效
    await this.bumpPermVersion([req.userId]);
    return true;
  }

  private parseId(raw: string, emptyMessage: string): number {
    if (raw === undefined || raw === null || raw === '') {
      throw new HttpException(emptyMessage, HttpStatus.BAD_REQUEST);
    }
    const id = Number(raw);
    if (Number.isNaN(id) || id <= 0) {
      throw new HttpException(emptyMessage, HttpStatus.BAD_REQUEST);
    }
    return id;
  }
}
