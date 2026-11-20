import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SmsLogDO } from '../entities/smsLog.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 短信日志管理仓库
 *
 * 日志表「只写 + 只读查询」：常规业务不提供 update/delete 方法族，
 * 仅保留 updateById 供发送/接收结果回写使用（见下方方法注释）。
 */
@Injectable()
export class SmsLogRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询短信日志
   */
  async selectById(id: number): Promise<SmsLogDO | null> {
    const row = await this.prisma.sysSmsLog.findUnique({ where: { id } });
    return (row as SmsLogDO | null) ?? null;
  }

  /**
   * 分页查询短信日志
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysSmsLogWhereInput,
    orderBy?: Prisma.SysSmsLogOrderByWithRelationInput,
  ): Promise<{ list: SmsLogDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysSmsLog.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysSmsLog.count({ where }),
    ]);
    return { list: list as SmsLogDO[], total };
  }

  /**
   * 查询短信日志列表（不分页）
   */
  async selectList(where?: Prisma.SysSmsLogWhereInput): Promise<SmsLogDO[]> {
    return this.prisma.sysSmsLog.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<SmsLogDO[]>;
  }

  /**
   * 新增短信日志（供短信发送后调用），返回插入行
   *
   * 日志写 INSERT INTO sys_sms_log，deleted 默认 false、deletedAt 默认 null（数据库默认值），无需显式写入。
   */
  async insert(data: TenantCreateInput<Prisma.SysSmsLogUncheckedCreateInput>): Promise<SmsLogDO> {
    const row = await this.prisma.sysSmsLog.create({ data: ensureTenantId(data) });
    return row as SmsLogDO;
  }

  /**
   * 统计短信日志数量
   */
  async count(where?: Prisma.SysSmsLogWhereInput): Promise<number> {
    return this.prisma.sysSmsLog.count({ where });
  }

  /**
   * 根据编号更新短信日志（仅供发送/接收结果回写使用）
   *
   * 使用 updateMany 语义（便于软删过滤与不存在时返回 false），
   * 调用方通常是：
   * - 发送结果回写：sendStatus / sendTime / apiSendCode / apiSendMsg / apiRequestId / apiSerialNo
   * - 接收结果回写：receiveStatus / receiveTime / apiReceiveCode / apiReceiveMsg
   */
  async updateById(
    id: number,
    data: Prisma.SysSmsLogUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysSmsLog.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }
}
