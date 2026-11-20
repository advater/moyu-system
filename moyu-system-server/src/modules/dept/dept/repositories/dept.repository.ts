import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { DeptDO } from '../entities/dept.entity';

/**
 * 部门管理仓库
 */
@Injectable()
export class DeptRepository {
  constructor(private prisma: PrismaService) {}

  /** 部门字段（不含软删/审计，用于精简查询） */
  private readonly simpleSelect: Prisma.SysDeptSelect = {
    id: true,
    name: true,
    parentId: true,
  };

  /**
   * 根据编号查询部门
   */
  async selectById(id: number): Promise<DeptDO | null> {
    const row = await this.prisma.sysDept.findUnique({ where: { id } });
    return (row as DeptDO | null) ?? null;
  }

  /**
   * 根据编号批量查询部门
   */
  async selectByIds(ids: number[]): Promise<DeptDO[]> {
    return this.prisma.sysDept.findMany({
      where: { id: { in: ids } },
    }) as Promise<DeptDO[]>;
  }

  /**
   * 查询部门列表（不分页）
   */
  async selectList(where?: Prisma.SysDeptWhereInput): Promise<DeptDO[]> {
    return this.prisma.sysDept.findMany({
      where,
      orderBy: { sort: 'asc' },
    }) as Promise<DeptDO[]>;
  }

  /**
   * 查询精简部门列表（id/name/parentId）
   */
  async selectSimpleList(where?: Prisma.SysDeptWhereInput): Promise<
    Array<Pick<DeptDO, 'id' | 'name' | 'parentId'>>
  > {
    return this.prisma.sysDept.findMany({
      where,
      select: this.simpleSelect,
      orderBy: { sort: 'asc' },
    });
  }

  /**
   * 根据条件查询单个部门（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysDeptWhereInput): Promise<DeptDO | null> {
    const row = await this.prisma.sysDept.findFirst({ where });
    return (row as DeptDO | null) ?? null;
  }

  /**
   * 插入部门，返回自增编号
   */
  async insert(data: Prisma.SysDeptUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysDept.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新部门
   */
  async updateById(
    id: number,
    data: Prisma.SysDeptUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysDept.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个部门
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysDept.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个部门
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysDept.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
