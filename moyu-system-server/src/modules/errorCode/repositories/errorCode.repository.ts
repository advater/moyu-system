import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ErrorCodeDO } from '../entities/errorCode.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';

@Injectable()
export class ErrorCodeRepository {
  constructor(private prisma: PrismaService) {}

  async selectById(id: number): Promise<ErrorCodeDO | null> {
    const row = await this.prisma.sysErrorCode.findUnique({ where: { id } });
    return (row) ?? null;
  }

  async selectByUnique(
    where: Prisma.SysErrorCodeWhereInput,
  ): Promise<ErrorCodeDO | null> {
    const row = await this.prisma.sysErrorCode.findFirst({ where });
    return (row) ?? null;
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysErrorCodeWhereInput,
  ): Promise<{ list: ErrorCodeDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysErrorCode.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysErrorCode.count({ where }),
    ]);
    return { list: rows as unknown as ErrorCodeDO[], total };
  }

  async insert(
    data: TenantCreateInput<Prisma.SysErrorCodeUncheckedCreateInput>,
  ): Promise<number> {
    const row = await this.prisma.sysErrorCode.create({
      data: ensureTenantId(data),
    });
    return row.id;
  }

  async updateById(
    id: number,
    data: Prisma.SysErrorCodeUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysErrorCode.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysErrorCode.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
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
