import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { JobDO, JobLogDO } from '../entities/job.entity';
import { freeUniqueCode } from '@/utils/soft-delete-code';
import { TenantContext } from '@/common/tenant/tenant.context';

/**
 * 定时任务仓库（平台级：读写均 ignore 租户）
 */
@Injectable()
export class JobRepository {
  constructor(private prisma: PrismaService) {}

  private runIgnore<T>(fn: () => Promise<T>): Promise<T> {
    return TenantContext.run({ tenantId: null, ignore: true }, fn);
  }

  async selectById(id: number): Promise<JobDO | null> {
    return this.runIgnore(async () => {
      const row = await this.prisma.sysJob.findUnique({ where: { id } });
      return (row as JobDO | null) ?? null;
    });
  }

  async selectByName(name: string): Promise<JobDO | null> {
    return this.runIgnore(async () => {
      const row = await this.prisma.sysJob.findFirst({ where: { name } });
      return (row as JobDO | null) ?? null;
    });
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysJobWhereInput,
  ): Promise<{ list: JobDO[]; total: number }> {
    return this.runIgnore(async () => {
      const skip = (params.page - 1) * params.pageSize;
      const [rows, total] = await Promise.all([
        this.prisma.sysJob.findMany({
          where,
          orderBy: { id: 'desc' },
          skip,
          take: params.pageSize,
        }),
        this.prisma.sysJob.count({ where }),
      ]);
      return { list: rows as unknown as JobDO[], total };
    });
  }

  async selectEnabledList(): Promise<JobDO[]> {
    return this.runIgnore(async () => {
      return this.prisma.sysJob.findMany({
        where: { status: 1 },
        orderBy: { id: 'asc' },
      }) as unknown as Promise<JobDO[]>;
    });
  }

  async insert(
    data: Prisma.SysJobUncheckedCreateInput,
  ): Promise<number> {
    return this.runIgnore(async () => {
      const row = await this.prisma.sysJob.create({ data });
      return row.id;
    });
  }

  async updateById(
    id: number,
    data: Prisma.SysJobUncheckedUpdateInput,
  ): Promise<boolean> {
    return this.runIgnore(async () => {
      const result = await this.prisma.sysJob.updateMany({
        where: { id },
        data,
      });
      return result.count > 0;
    });
  }

  async deleteById(id: number): Promise<boolean> {
    return this.runIgnore(async () => {
      const existing = await this.prisma.sysJob.findUnique({ where: { id } });
      if (!existing) return false;
      const result = await this.prisma.sysJob.updateMany({
        where: { id },
        data: {
          deleted: true,
          deletedAt: new Date(),
          name: freeUniqueCode(existing.name, id, 64),
          status: 0,
        },
      });
      return result.count > 0;
    });
  }
}

@Injectable()
export class JobLogRepository {
  constructor(private prisma: PrismaService) {}

  private runIgnore<T>(fn: () => Promise<T>): Promise<T> {
    return TenantContext.run({ tenantId: null, ignore: true }, fn);
  }

  async selectById(id: number): Promise<JobLogDO | null> {
    return this.runIgnore(async () => {
      const row = await this.prisma.sysJobLog.findUnique({ where: { id } });
      return (row as JobLogDO | null) ?? null;
    });
  }

  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysJobLogWhereInput,
  ): Promise<{ list: JobLogDO[]; total: number }> {
    return this.runIgnore(async () => {
      const skip = (params.page - 1) * params.pageSize;
      const [rows, total] = await Promise.all([
        this.prisma.sysJobLog.findMany({
          where,
          orderBy: { id: 'desc' },
          skip,
          take: params.pageSize,
        }),
        this.prisma.sysJobLog.count({ where }),
      ]);
      return { list: rows as unknown as JobLogDO[], total };
    });
  }

  async insert(
    data: Prisma.SysJobLogUncheckedCreateInput,
  ): Promise<number> {
    return this.runIgnore(async () => {
      const row = await this.prisma.sysJobLog.create({ data });
      return row.id;
    });
  }

  async updateById(
    id: number,
    data: Prisma.SysJobLogUncheckedUpdateInput,
  ): Promise<boolean> {
    return this.runIgnore(async () => {
      const result = await this.prisma.sysJobLog.updateMany({
        where: { id },
        data,
      });
      return result.count > 0;
    });
  }
}
