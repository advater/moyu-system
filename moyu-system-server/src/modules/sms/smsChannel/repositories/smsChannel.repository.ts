import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SmsChannelDO } from '../entities/smsChannel.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 短信渠道管理仓库
 */
@Injectable()
export class SmsChannelRepository {
  constructor(private prisma: PrismaService) {}

  /** 短信渠道字段（不含软删/审计，用于精简查询） */
  private readonly simpleSelect: Prisma.SysSmsChannelSelect = {
    id: true,
    signature: true,
    code: true,
  };

  /**
   * 根据编号查询短信渠道
   */
  async selectById(id: number): Promise<SmsChannelDO | null> {
    const row = await this.prisma.sysSmsChannel.findUnique({ where: { id } });
    return (row as SmsChannelDO | null) ?? null;
  }

  /**
   * 根据编号批量查询短信渠道
   */
  async selectByIds(ids: number[]): Promise<SmsChannelDO[]> {
    return this.prisma.sysSmsChannel.findMany({
      where: { id: { in: ids } },
    }) as Promise<SmsChannelDO[]>;
  }

  /**
   * 分页查询短信渠道
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysSmsChannelWhereInput,
    orderBy?: Prisma.SysSmsChannelOrderByWithRelationInput,
  ): Promise<{ list: SmsChannelDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysSmsChannel.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysSmsChannel.count({ where }),
    ]);
    return { list: list as SmsChannelDO[], total };
  }

  /**
   * 查询短信渠道列表（不分页）
   */
  async selectList(where?: Prisma.SysSmsChannelWhereInput): Promise<SmsChannelDO[]> {
    return this.prisma.sysSmsChannel.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<SmsChannelDO[]>;
  }

  /**
   * 查询精简短信渠道列表（id/signature/code）
   */
  async selectSimpleList(where?: Prisma.SysSmsChannelWhereInput): Promise<
    Array<Pick<SmsChannelDO, 'id' | 'signature' | 'code'>>
  > {
    return this.prisma.sysSmsChannel.findMany({
      where,
      select: this.simpleSelect,
      orderBy: { createTime: 'desc' },
    }) as Promise<Array<Pick<SmsChannelDO, 'id' | 'signature' | 'code'>>>;
  }

  /**
   * 根据条件查询单个短信渠道（用于唯一性校验）
   */
  async selectByUnique(
    where: Prisma.SysSmsChannelWhereInput,
  ): Promise<SmsChannelDO | null> {
    const row = await this.prisma.sysSmsChannel.findFirst({ where });
    return (row as SmsChannelDO | null) ?? null;
  }

  /**
   * 插入短信渠道，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysSmsChannelUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysSmsChannel.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新短信渠道
   */
  async updateById(
    id: number,
    data: Prisma.SysSmsChannelUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysSmsChannel.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个短信渠道（释放 code 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个短信渠道（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const rows = await this.prisma.sysSmsChannel.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.sysSmsChannel.updateMany({
          where: { id: row.id },
          data: {
            code: freeUniqueCode(row.code, row.id, 64),
            deleted: true,
            deletedAt: now,
          },
        });
      }
    });
    return rows.length > 0;
  }
}
