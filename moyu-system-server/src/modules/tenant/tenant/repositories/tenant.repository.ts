import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { TenantDO } from '../entities/tenant.entity';

/**
 * 租户管理仓库
 */
@Injectable()
export class TenantRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询租户
   */
  async selectById(id: number): Promise<TenantDO | null> {
    const row = await this.prisma.sysTenant.findUnique({ where: { id } });
    return (row as unknown as TenantDO | null) ?? null;
  }

  /**
   * 根据编号批量查询租户
   */
  async selectByIds(ids: number[]): Promise<TenantDO[]> {
    const rows = await this.prisma.sysTenant.findMany({
      where: { id: { in: ids } },
    });
    return rows as unknown as TenantDO[];
  }

  /**
   * 分页查询租户
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysTenantWhereInput,
  ): Promise<{ list: TenantDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysTenant.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysTenant.count({ where }),
    ]);
    return { list: rows as unknown as TenantDO[], total };
  }

  /**
   * 查询租户列表（不分页）
   */
  async selectList(where?: Prisma.SysTenantWhereInput): Promise<TenantDO[]> {
    const rows = await this.prisma.sysTenant.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as TenantDO[];
  }

  /**
   * 根据条件查询单个租户（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysTenantWhereInput): Promise<TenantDO | null> {
    const row = await this.prisma.sysTenant.findFirst({ where });
    return (row as unknown as TenantDO | null) ?? null;
  }

  /**
   * 插入租户，返回自增编号
   */
  async insert(data: Prisma.SysTenantUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysTenant.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新租户
   */
  async updateById(
    id: number,
    data: Prisma.SysTenantUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysTenant.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个租户
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysTenant.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个租户
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysTenant.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
