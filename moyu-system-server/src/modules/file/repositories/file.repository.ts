import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { FileDO } from '../entities/file.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';

function toFileDO(row: Record<string, unknown> | null): FileDO | null {
  if (!row) return null;
  return {
    ...(row as unknown as FileDO),
    size: Number(row.size ?? 0),
  };
}

@Injectable()
export class FileRepository {
  constructor(private prisma: PrismaService) {}

  async selectById(id: number): Promise<FileDO | null> {
    const row = await this.prisma.sysFile.findUnique({ where: { id } });
    return toFileDO(row as unknown as Record<string, unknown> | null);
  }

  async selectByHash(hash: string): Promise<FileDO | null> {
    const row = await this.prisma.sysFile.findFirst({
      where: { hash },
      orderBy: { id: 'asc' },
    });
    return toFileDO(row as unknown as Record<string, unknown> | null);
  }

  async countLiveByPath(path: string): Promise<number> {
    if (!path) return 0;
    return this.prisma.sysFile.count({ where: { path } });
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysFileWhereInput,
  ): Promise<{ list: FileDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysFile.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysFile.count({ where }),
    ]);
    return {
      list: rows.map((r) => toFileDO(r as unknown as Record<string, unknown>)!),
      total,
    };
  }

  async insert(
    data: TenantCreateInput<Prisma.SysFileUncheckedCreateInput>,
  ): Promise<number> {
    const row = await this.prisma.sysFile.create({
      data: ensureTenantId(data),
    });
    return row.id;
  }

  async updateById(
    id: number,
    data: Prisma.SysFileUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysFile.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysFile.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids?.length) return false;
    const result = await this.prisma.sysFile.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  async selectDeletedBefore(
    cutoff: Date,
    take = 200,
    afterId = 0,
  ): Promise<FileDO[]> {
    const rows = await this.prisma.sysFile.findMany({
      where: {
        deletedAt: { lte: cutoff },
        ...(afterId > 0 ? { id: { gt: afterId } } : {}),
      },
      orderBy: { id: 'asc' },
      take,
    });
    return rows
      .map((r) => toFileDO(r as unknown as Record<string, unknown>))
      .filter((r): r is FileDO => r != null);
  }
}
