import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ConfigDO } from '../entities/config.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';

/**
 * 参数配置仓库
 */
@Injectable()
export class ConfigRepository {
  constructor(private prisma: PrismaService) {}

  async selectById(id: number): Promise<ConfigDO | null> {
    const row = await this.prisma.sysConfig.findUnique({ where: { id } });
    return (row as ConfigDO | null) ?? null;
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysConfigWhereInput,
  ): Promise<{ list: ConfigDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysConfig.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysConfig.count({ where }),
    ]);
    return { list: rows as unknown as ConfigDO[], total };
  }

  async selectList(where?: Prisma.SysConfigWhereInput): Promise<ConfigDO[]> {
    return this.prisma.sysConfig.findMany({
      where,
      orderBy: { id: 'asc' },
    }) as unknown as Promise<ConfigDO[]>;
  }

  async selectByUnique(
    where: Prisma.SysConfigWhereInput,
  ): Promise<ConfigDO | null> {
    const row = await this.prisma.sysConfig.findFirst({ where });
    return (row as ConfigDO | null) ?? null;
  }

  async insert(
    data: TenantCreateInput<Prisma.SysConfigUncheckedCreateInput>,
  ): Promise<number> {
    const row = await this.prisma.sysConfig.create({
      data: ensureTenantId(data),
    });
    return row.id;
  }

  async updateById(
    id: number,
    data: Prisma.SysConfigUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysConfig.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const existing = await this.selectById(id);
    if (!existing) return false;
    const result = await this.prisma.sysConfig.updateMany({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        configKey: freeUniqueCode(existing.configKey, id, 100),
      },
    });
    return result.count > 0;
  }

  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids?.length) return false;
    for (const id of ids) {
      await this.deleteById(id);
    }
    return true;
  }
}
