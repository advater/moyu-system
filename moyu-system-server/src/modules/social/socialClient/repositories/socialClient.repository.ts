import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SocialClientDO } from '../entities/socialClient.entity';

/**
 * 社交客户端管理仓库
 */
@Injectable()
export class SocialClientRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询社交客户端
   */
  async selectById(id: number): Promise<SocialClientDO | null> {
    const row = await this.prisma.sysSocialClient.findUnique({ where: { id } });
    return (row as unknown as SocialClientDO | null) ?? null;
  }

  /**
   * 根据编号批量查询社交客户端
   */
  async selectByIds(ids: number[]): Promise<SocialClientDO[]> {
    const rows = await this.prisma.sysSocialClient.findMany({
      where: { id: { in: ids } },
    });
    return rows as unknown as SocialClientDO[];
  }

  /**
   * 分页查询社交客户端
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysSocialClientWhereInput,
  ): Promise<{ list: SocialClientDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysSocialClient.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysSocialClient.count({ where }),
    ]);
    return { list: rows as unknown as SocialClientDO[], total };
  }

  /**
   * 查询社交客户端列表（不分页）
   */
  async selectList(where?: Prisma.SysSocialClientWhereInput): Promise<SocialClientDO[]> {
    const rows = await this.prisma.sysSocialClient.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as SocialClientDO[];
  }

  /**
   * 根据条件查询单个社交客户端（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysSocialClientWhereInput): Promise<SocialClientDO | null> {
    const row = await this.prisma.sysSocialClient.findFirst({ where });
    return (row as unknown as SocialClientDO | null) ?? null;
  }

  /**
   * 插入社交客户端，返回自增编号
   */
  async insert(data: Prisma.SysSocialClientUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysSocialClient.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新社交客户端
   */
  async updateById(
    id: number,
    data: Prisma.SysSocialClientUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysSocialClient.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个社交客户端
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysSocialClient.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个社交客户端
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysSocialClient.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
