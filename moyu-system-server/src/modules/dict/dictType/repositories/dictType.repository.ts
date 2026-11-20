import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { DictTypeDO } from '../entities/dictType.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 字典类型管理仓库
 */
@Injectable()
export class DictTypeRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询字典类型
   */
  async selectById(id: number): Promise<DictTypeDO | null> {
    const row = await this.prisma.sysDictType.findUnique({ where: { id } });
    return (row as DictTypeDO | null) ?? null;
  }

  /**
   * 分页查询字典类型
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysDictTypeWhereInput,
    orderBy?: Prisma.SysDictTypeOrderByWithRelationInput,
  ): Promise<{ list: DictTypeDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysDictType.findMany({
        where,
        orderBy: orderBy ?? { updateTime: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysDictType.count({ where }),
    ]);
    return { list: rows as unknown as DictTypeDO[], total };
  }

  /**
   * 查询字典类型列表（不分页）
   */
  async selectList(where?: Prisma.SysDictTypeWhereInput): Promise<DictTypeDO[]> {
    return this.prisma.sysDictType.findMany({
      where,
      orderBy: { updateTime: 'desc' },
    }) as unknown as Promise<DictTypeDO[]>;
  }

  /**
   * 根据条件查询单个字典类型（用于 type 唯一性校验）
   */
  async selectByUnique(
    where: Prisma.SysDictTypeWhereInput,
  ): Promise<DictTypeDO | null> {
    const row = await this.prisma.sysDictType.findFirst({ where });
    return (row as DictTypeDO | null) ?? null;
  }

  /**
   * 插入字典类型，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysDictTypeUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysDictType.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新字典类型
   */
  async updateById(
    id: number,
    data: Prisma.SysDictTypeUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysDictType.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个字典类型（释放 type 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个字典类型（释放 type 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const rows = await this.prisma.sysDictType.findMany({
      where: { id: { in: ids } },
      select: { id: true, type: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.sysDictType.updateMany({
          where: { id: row.id },
          data: {
            type: freeUniqueCode(row.type, row.id, 100),
            deleted: true,
            deletedAt: now,
          },
        });
      }
    });
    return rows.length > 0;
  }
}
