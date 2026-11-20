import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { DictDataDO } from '../entities/dictData.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 字典数据管理仓库
 */
@Injectable()
export class DictDataRepository {
  constructor(private prisma: PrismaService) {}

  /** 字典数据精简字段（用于精简查询，与 DictDataSimpleResDTO 对齐） */
  private readonly simpleSelect: Prisma.SysDictDataSelect = {
    dictType: true,
    value: true,
    label: true,
    colorType: true,
    cssClass: true,
  };

  /**
   * 根据编号查询字典数据
   */
  async selectById(id: number): Promise<DictDataDO | null> {
    const row = await this.prisma.sysDictData.findUnique({ where: { id } });
    return (row as DictDataDO | null) ?? null;
  }

  /**
   * 根据编号批量查询字典数据
   */
  async selectByIds(ids: number[]): Promise<DictDataDO[]> {
    return this.prisma.sysDictData.findMany({
      where: { id: { in: ids } },
    }) as Promise<DictDataDO[]>;
  }

  /**
   * 分页查询字典数据
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysDictDataWhereInput,
    orderBy:
      | Prisma.SysDictDataOrderByWithRelationInput
      | Prisma.SysDictDataOrderByWithRelationInput[] = [
      { dictType: 'asc' },
      { sort: 'asc' },
    ],
  ): Promise<{ list: DictDataDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysDictData.findMany({
        where,
        orderBy,
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysDictData.count({ where }),
    ]);
    return { list: list as DictDataDO[], total };
  }

  /**
   * 查询字典数据列表（不分页）
   */
  async selectList(where?: Prisma.SysDictDataWhereInput): Promise<DictDataDO[]> {
    return this.prisma.sysDictData.findMany({
      where,
      orderBy: [{ dictType: 'asc' }, { sort: 'asc' }],
    }) as Promise<DictDataDO[]>;
  }

  /**
   * 查询精简字典数据列表（dictType/value/label/colorType/cssClass）
   */
  async selectSimpleList(where?: Prisma.SysDictDataWhereInput): Promise<
    Array<Pick<DictDataDO, 'dictType' | 'value' | 'label' | 'colorType' | 'cssClass'>>
  > {
    return this.prisma.sysDictData.findMany({
      where,
      select: this.simpleSelect,
      orderBy: [{ dictType: 'asc' }, { sort: 'asc' }],
    }) as Promise<
      Array<Pick<DictDataDO, 'dictType' | 'value' | 'label' | 'colorType' | 'cssClass'>>
    >;
  }

  /**
   * 根据字典类型 + 字典值查询字典数据（用于重复校验）
   *
   * 字典数据表无唯一键，约定同一 dictType 下 value 不允许重复；
   * excludeId 用于更新时排除自身。
   */
  async selectByDictTypeAndValue(
    dictType: string,
    value: string,
    excludeId?: number,
  ): Promise<DictDataDO | null> {
    const row = await this.prisma.sysDictData.findFirst({
      where: {
        dictType,
        value,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
    return (row as DictDataDO | null) ?? null;
  }

  /**
   * 插入字典数据，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysDictDataUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysDictData.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新字典数据
   */
  async updateById(
    id: number,
    data: Prisma.SysDictDataUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysDictData.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个字典数据
   */
  async deleteById(id: number): Promise<boolean> {
    const existing = await this.selectById(id);
    if (!existing) return false;
    const result = await this.prisma.sysDictData.updateMany({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        value: freeUniqueCode(existing.value, id, 100),
      },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个字典数据
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids?.length) return false;
    for (const id of ids) {
      await this.deleteById(id);
    }
    return true;
  }
}
