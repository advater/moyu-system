import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { UserDO } from '../entities/user.entity';
import { toIntArray } from '@/utils/to-positive-int';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

/**
 * 用户管理仓库
 */
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询用户
   */
  async selectById(id: number): Promise<UserDO | null> {
    const row = await this.prisma.sysUser.findUnique({ where: { id } });
    return (row as UserDO | null) ?? null;
  }

  /**
   * 根据编号批量查询用户
   */
  async selectByIds(ids: number[] | string | number): Promise<UserDO[]> {
    const idList = toIntArray(ids);
    if (idList.length === 0) {
      return [];
    }
    return this.prisma.sysUser.findMany({
      where: { id: { in: idList } },
    }) as Promise<UserDO[]>;
  }

  /**
   * 查询用户当前权限版本号（供访问令牌快照比对；调用方需跳过租户过滤）
   *
   * 返回 null 表示用户不存在或已删除（此时令牌应视为失效）。
   */
  async selectPermVersionById(id: number): Promise<number | null> {
    const row = await this.prisma.sysUser.findFirst({
      where: { id },
      select: { permVersion: true },
    });
    return row?.permVersion ?? null;
  }

  /**
   * 查询令牌校验所需的用户状态快照（供鉴权链路一次取全，避免重复查库）
   *
   * 返回 null 表示用户不存在或已删除（此时令牌应视为失效）。
   */
  async selectAuthStateById(id: number): Promise<{
    status: number;
    permVersion: number;
    mustChangePassword: boolean;
    passwordUpdateTime: Date | null;
  } | null> {
    const row = await this.prisma.sysUser.findFirst({
      where: { id },
      select: {
        status: true,
        permVersion: true,
        mustChangePassword: true,
        passwordUpdateTime: true,
      },
    });
    return row ?? null;
  }

  /**
   * 分页查询用户
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysUserWhereInput,
    orderBy?: Prisma.SysUserOrderByWithRelationInput,
  ): Promise<{ list: UserDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where,
        orderBy: orderBy ?? { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysUser.count({ where }),
    ]);
    return { list: rows as UserDO[], total };
  }

  /**
   * 查询用户列表（不分页）
   */
  async selectList(where?: Prisma.SysUserWhereInput): Promise<UserDO[]> {
    return this.prisma.sysUser.findMany({
      where,
      orderBy: { id: 'desc' },
    }) as Promise<UserDO[]>;
  }

  /**
   * 根据条件查询单个用户（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysUserWhereInput): Promise<UserDO | null> {
    const row = await this.prisma.sysUser.findFirst({ where });
    return (row as UserDO | null) ?? null;
  }

  /**
   * 根据角色编号查询关联的用户编号列表
   */
  async selectUserIdsByRoleId(roleId: number): Promise<number[]> {
    const rows = await this.prisma.sysUserRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  /**
   * 插入用户，返回自增编号
   */
  async insert(data: Prisma.SysUserUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysUser.create({ data });
    return row.id;
  }

  /**
   * 创建用户并同步岗位关联（同一事务）
   */
  async insertWithPosts(
    data: Prisma.SysUserUncheckedCreateInput,
    postIds: number[] = [],
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.sysUser.create({ data });
      await this.syncUserPosts(tx, row.id, postIds);
      return row.id;
    });
  }

  /**
   * 根据编号更新用户
   */
  async updateById(
    id: number,
    data: Prisma.SysUserUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysUser.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 批量递增用户权限版本号（赋权 / 角色变更后调用，使旧访问令牌立即失效）
   */
  async incrementPermVersionByIds(ids: number[]): Promise<number> {
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) {
      return 0;
    }
    const result = await this.prisma.sysUser.updateMany({
      where: { id: { in: uniq } },
      data: { permVersion: { increment: 1 } },
    });
    return result.count;
  }

  /**
   * 最近 N 条历史密码哈希（按时间倒序，供「不可复用最近密码」校验）
   */
  async selectRecentPasswordHashes(
    userId: number,
    limit: number,
  ): Promise<string[]> {
    const rows = await this.prisma.sysUserPasswordHistory.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit,
      select: { password: true },
    });
    return rows.map((row) => row.password);
  }

  /**
   * 记录一条历史密码，并把超出 limit 的旧记录软删（保持历史长度为 limit）
   */
  async insertPasswordHistory(
    userId: number,
    password: string,
    limit: number,
  ): Promise<void> {
    const tenantId = TenantContext.requireTenantId(DEFAULT_TENANT_ID);
    await this.prisma.sysUserPasswordHistory.create({
      data: { tenantId, userId, password },
    });
    const overflow = await this.prisma.sysUserPasswordHistory.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      skip: limit,
      select: { id: true },
    });
    if (overflow.length === 0) return;
    await this.prisma.sysUserPasswordHistory.updateMany({
      where: { id: { in: overflow.map((row) => row.id) } },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  /**
   * 更新用户并同步岗位关联（同一事务）
   */
  async updateByIdWithPosts(
    id: number,
    data: Prisma.SysUserUncheckedUpdateInput,
    postIds?: number[],
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.sysUser.updateMany({ where: { id }, data });
      if (postIds !== undefined) {
        await this.syncUserPosts(tx, id, postIds);
      }
      return result.count > 0;
    });
  }

  /**
   * 软删除单个用户（同步清理岗位/角色关联）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchByIds([id]);
  }

  /**
   * 软删除多个用户（同步清理岗位/角色关联）
   */
  async deleteBatchByIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    // 软删前释放 username 唯一约束：改名为原账号 + 删除标记，便于同名重建
    const users = await this.prisma.sysUser.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const u of users) {
        const freed = `${u.username}__del__${u.id}`.slice(0, 30);
        await tx.sysUser.updateMany({
          where: { id: u.id },
          data: {
            username: freed,
            deleted: true,
            deletedAt: now,
          },
        });
      }
      await tx.sysUserProfile.updateMany({
        where: { userId: { in: ids } },
        data: {
          email: null,
          mobile: null,
          deleted: true,
          deletedAt: now,
        },
      });
      await tx.sysUserPost.updateMany({
        where: { userId: { in: ids } },
        data: { deleted: true, deletedAt: now },
      });
      await tx.sysUserRole.updateMany({
        where: { userId: { in: ids } },
        data: { deleted: true, deletedAt: now },
      });
    });
    return users.length > 0;
  }

  /**
   * 全量同步用户岗位关联（软删未选择项 + 幂等恢复已选择项）
   */
  private async syncUserPosts(
    tx: Prisma.TransactionClient,
    userId: number,
    postIds: number[],
  ): Promise<void> {
    const tenantId = TenantContext.requireTenantId(DEFAULT_TENANT_ID);
    const uniq = [...new Set(postIds)];
    if (uniq.length === 0) {
      await tx.sysUserPost.updateMany({
        where: { userId },
        data: { deleted: true, deletedAt: new Date() },
      });
      return;
    }
    // 移除已取消的岗位关联
    await tx.sysUserPost.updateMany({
      where: { userId, postId: { notIn: uniq } },
      data: { deleted: true, deletedAt: new Date() },
    });
    // 幂等写入/恢复选择的岗位关联
    for (const postId of uniq) {
      await tx.sysUserPost.upsert({
        where: {
          tenantId_userId_postId: { tenantId, userId, postId },
        },
        create: { tenantId, userId, postId },
        update: { deleted: false, deletedAt: null },
      });
    }
  }
}
