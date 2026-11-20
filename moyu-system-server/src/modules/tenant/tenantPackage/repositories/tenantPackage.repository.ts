import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { TenantPackageDO } from '../entities/tenantPackage.entity';

/**
 * 租户套餐管理仓库
 */
@Injectable()
export class TenantPackageRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询租户套餐
   */
  async selectById(id: number): Promise<TenantPackageDO | null> {
    const row = await this.prisma.sysTenantPackage.findUnique({ where: { id } });
    return (row as unknown as TenantPackageDO | null) ?? null;
  }

  /**
   * 根据编号批量查询租户套餐
   */
  async selectByIds(ids: number[]): Promise<TenantPackageDO[]> {
    const rows = await this.prisma.sysTenantPackage.findMany({
      where: { id: { in: ids } },
    });
    return rows as unknown as TenantPackageDO[];
  }

  /**
   * 分页查询租户套餐
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysTenantPackageWhereInput,
  ): Promise<{ list: TenantPackageDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysTenantPackage.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysTenantPackage.count({ where }),
    ]);
    return { list: rows as unknown as TenantPackageDO[], total };
  }

  /**
   * 查询租户套餐列表（不分页）
   */
  async selectList(where?: Prisma.SysTenantPackageWhereInput): Promise<TenantPackageDO[]> {
    const rows = await this.prisma.sysTenantPackage.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as TenantPackageDO[];
  }

  /**
   * 根据条件查询单个租户套餐（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysTenantPackageWhereInput): Promise<TenantPackageDO | null> {
    const row = await this.prisma.sysTenantPackage.findFirst({ where });
    return (row as unknown as TenantPackageDO | null) ?? null;
  }

  /**
   * 插入租户套餐，返回自增编号
   */
  async insert(data: Prisma.SysTenantPackageUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysTenantPackage.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新租户套餐
   */
  async updateById(
    id: number,
    data: Prisma.SysTenantPackageUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysTenantPackage.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个租户套餐
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysTenantPackage.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个租户套餐
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysTenantPackage.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
