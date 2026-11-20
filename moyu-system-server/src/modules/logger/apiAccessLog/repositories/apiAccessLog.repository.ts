import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ApiAccessLogDO } from '../entities/apiAccessLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';

@Injectable()
export class ApiAccessLogRepository {
  constructor(private prisma: PrismaService) {}

  async selectById(id: number): Promise<ApiAccessLogDO | null> {
    const row = await this.prisma.sysApiAccessLog.findUnique({ where: { id } });
    return (row) ?? null;
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysApiAccessLogWhereInput,
  ): Promise<{ list: ApiAccessLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysApiAccessLog.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysApiAccessLog.count({ where }),
    ]);
    return { list: rows as unknown as ApiAccessLogDO[], total };
  }

  async insert(
    data: TenantCreateInput<Prisma.SysApiAccessLogUncheckedCreateInput>,
  ): Promise<number> {
    const row = await this.prisma.sysApiAccessLog.create({
      data: ensureTenantId(data),
    });
    return row.id;
  }
}
