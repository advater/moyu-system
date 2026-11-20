import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OperateLogDO } from '../entities/operateLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 操作日志管理仓库
 *
 * 操作日志为写后即弃的审计数据：仅提供查询/插入/计数能力，
 * 不提供 update/delete 方法族。
 */
@Injectable()
export class OperateLogRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询操作日志
   */
  async selectById(id: number): Promise<OperateLogDO | null> {
    const row = await this.prisma.sysOperateLog.findUnique({ where: { id } });
    // bizId 保持 Prisma BigInt 原样返回，由 Service 层负责序列化
    return (row as OperateLogDO | null) ?? null;
  }

  /**
   * 分页查询操作日志
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysOperateLogWhereInput,
    orderBy?: Prisma.SysOperateLogOrderByWithRelationInput,
  ): Promise<{ list: OperateLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysOperateLog.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysOperateLog.count({ where }),
    ]);
    return { list: list as unknown as OperateLogDO[], total };
  }

  /**
   * 查询操作日志列表（不分页）
   */
  async selectList(where?: Prisma.SysOperateLogWhereInput): Promise<OperateLogDO[]> {
    return this.prisma.sysOperateLog.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as unknown as Promise<OperateLogDO[]>;
  }

  /**
   * 插入操作日志，返回插入行（供 AOP/拦截器记录操作日志）
   */
  async insert(data: TenantCreateInput<Prisma.SysOperateLogUncheckedCreateInput>): Promise<OperateLogDO> {
    const row = await this.prisma.sysOperateLog.create({ data: ensureTenantId(data) });
    return row as unknown as OperateLogDO;
  }

  /**
   * 统计操作日志数量
   */
  async count(where?: Prisma.SysOperateLogWhereInput): Promise<number> {
    return this.prisma.sysOperateLog.count({ where });
  }
}
