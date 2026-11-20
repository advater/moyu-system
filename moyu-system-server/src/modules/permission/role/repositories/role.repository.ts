import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { RoleDO } from '../entities/role.entity';
import { freeUniqueCode } from '@/utils/soft-delete-code';

/**
 * 角色管理仓库
 */
@Injectable()
export class RoleRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询角色
   */
  async selectById(id: number): Promise<RoleDO | null> {
    const row = await this.prisma.sysRole.findUnique({ where: { id } });
    return (row as RoleDO | null) ?? null;
  }

  /**
   * 根据编号批量查询角色
   */
  async selectByIds(ids: number[]): Promise<RoleDO[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.prisma.sysRole.findMany({
      where: { id: { in: ids } },
      orderBy: { sort: 'asc' },
    }) as Promise<RoleDO[]>;
  }

  /**
   * 分页查询角色
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysRoleWhereInput,
    orderBy?: Prisma.SysRoleOrderByWithRelationInput,
  ): Promise<{ list: RoleDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysRole.findMany({
        where,
        orderBy: orderBy ?? { sort: 'asc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysRole.count({ where }),
    ]);
    return { list: rows as RoleDO[], total };
  }

  /**
   * 查询角色列表（不分页，按 sort 升序）
   */
  async selectList(where?: Prisma.SysRoleWhereInput): Promise<RoleDO[]> {
    return this.prisma.sysRole.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    }) as Promise<RoleDO[]>;
  }

  /**
   * 根据条件查询单个角色（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysRoleWhereInput): Promise<RoleDO | null> {
    const row = await this.prisma.sysRole.findFirst({ where });
    return (row as RoleDO | null) ?? null;
  }

  /**
   * 插入角色，返回自增编号
   */
  async insert(data: Prisma.SysRoleUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysRole.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新角色
   */
  async updateById(
    id: number,
    data: Prisma.SysRoleUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysRole.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个角色
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个角色（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const roles = await this.prisma.sysRole.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const role of roles) {
        await tx.sysRole.updateMany({
          where: { id: role.id },
          data: {
            code: freeUniqueCode(role.code, role.id, 100),
            deleted: true,
            deletedAt: now,
          },
        });
      }
    });
    return roles.length > 0;
  }
}
