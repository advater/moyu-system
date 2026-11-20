import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { MailLogDO } from '../entities/mailLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 邮件日志管理仓库
 *
 * 日志表只写 + 只读查询：不对业务开放 update/delete 方法族，
 * 仅保留发送结果回写用的内部 updateById（见方法注释）。
 * 注意：MailLog 主键 id 为 BigInt（自增），查询/插入返回的行保持 BigInt 原样，
 * 由 Service 层负责序列化为 ResDTO。
 */
@Injectable()
export class MailLogRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询邮件日志
   */
  async selectById(id: number | bigint): Promise<MailLogDO | null> {
    const row = await this.prisma.sysMailLog.findUnique({ where: { id } });
    return (row as MailLogDO | null) ?? null;
  }

  /**
   * 分页查询邮件日志
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysMailLogWhereInput,
    orderBy?: Prisma.SysMailLogOrderByWithRelationInput,
  ): Promise<{ list: MailLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysMailLog.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysMailLog.count({ where }),
    ]);
    return { list: list as MailLogDO[], total };
  }

  /**
   * 查询邮件日志列表（不分页）
   */
  async selectList(where?: Prisma.SysMailLogWhereInput): Promise<MailLogDO[]> {
    return this.prisma.sysMailLog.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<MailLogDO[]>;
  }

  /**
   * 新增邮件日志（供发信流程调用），返回插入行
   *
   * 日志写 INSERT INTO sys_mail_log，deleted 默认 false、deletedAt 默认 null（数据库默认值），无需显式写入。
   */
  async insert(data: TenantCreateInput<Prisma.SysMailLogUncheckedCreateInput>): Promise<MailLogDO> {
    const row = await this.prisma.sysMailLog.create({ data: ensureTenantId(data) });
    return row as MailLogDO;
  }

  /**
   * 根据编号更新邮件日志（内部方法：仅供发信流程回写发送结果使用，日志模块不对业务开放更新入口）
   *
   * 发送成功后回写 sendStatus=10/sendTime/sendMessageId，失败后回写 sendStatus=20/sendException。
   * 主键 id 数据库为 BigInt，传 number/bigint 均可。
   */
  async updateById(
    id: number | bigint,
    data: Prisma.SysMailLogUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysMailLog.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 统计邮件日志数量
   */
  async count(where?: Prisma.SysMailLogWhereInput): Promise<number> {
    return this.prisma.sysMailLog.count({ where });
  }
}
