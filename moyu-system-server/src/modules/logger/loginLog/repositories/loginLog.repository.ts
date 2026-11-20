import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { LoginLogDO } from '../entities/loginLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 登录日志管理仓库
 *
 * 日志表只写 + 只读查询：不提供 update/delete 方法族。
 */
@Injectable()
export class LoginLogRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询登录日志
   */
  async selectById(id: number): Promise<LoginLogDO | null> {
    const row = await this.prisma.sysLoginLog.findUnique({ where: { id } });
    return (row as LoginLogDO | null) ?? null;
  }

  /**
   * 分页查询登录日志
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysLoginLogWhereInput,
    orderBy?: Prisma.SysLoginLogOrderByWithRelationInput,
  ): Promise<{ list: LoginLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysLoginLog.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysLoginLog.count({ where }),
    ]);
    return { list: list as LoginLogDO[], total };
  }

  /**
   * 查询登录日志列表（不分页）
   */
  async selectList(where?: Prisma.SysLoginLogWhereInput): Promise<LoginLogDO[]> {
    return this.prisma.sysLoginLog.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<LoginLogDO[]>;
  }

  /**
   * 新增登录日志（供 AOP/拦截器调用），返回插入行
   *
   * 日志写 INSERT INTO sys_login_log，deleted 默认 false、deletedAt 默认 null（数据库默认值），无需显式写入。
   */
  async insert(data: TenantCreateInput<Prisma.SysLoginLogUncheckedCreateInput>): Promise<LoginLogDO> {
    const row = await this.prisma.sysLoginLog.create({ data: ensureTenantId(data) });
    return row as LoginLogDO;
  }

  /**
   * 统计登录日志数量
   */
  async count(where?: Prisma.SysLoginLogWhereInput): Promise<number> {
    return this.prisma.sysLoginLog.count({ where });
  }
}
