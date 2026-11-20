import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ApiErrorLogDO } from '../../apiAccessLog/entities/apiAccessLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';

@Injectable()
export class ApiErrorLogRepository {
  constructor(private prisma: PrismaService) {}

  async selectById(id: number): Promise<ApiErrorLogDO | null> {
    const row = await this.prisma.sysApiErrorLog.findUnique({ where: { id } });
    return (row) ?? null;
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysApiErrorLogWhereInput,
  ): Promise<{ list: ApiErrorLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysApiErrorLog.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysApiErrorLog.count({ where }),
    ]);
    return { list: rows as unknown as ApiErrorLogDO[], total };
  }

  async insert(
    data: TenantCreateInput<Prisma.SysApiErrorLogUncheckedCreateInput>,
  ): Promise<number> {
    const row = await this.prisma.sysApiErrorLog.create({
      data: ensureTenantId(data),
    });
    return row.id;
  }

  async updateById(
    id: number,
    data: Prisma.SysApiErrorLogUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysApiErrorLog.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }
}
