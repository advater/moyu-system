import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SmsTemplateDO } from '../entities/smsTemplate.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 短信模板管理仓库
 */
@Injectable()
export class SmsTemplateRepository {
  constructor(private prisma: PrismaService) {}

  /** 精简字段（simple-list 使用） */
  private readonly simpleSelect: Prisma.SysSmsTemplateSelect = {
    id: true,
    name: true,
    code: true,
  };

  /**
   * 根据编号查询短信模板
   */
  async selectById(id: number): Promise<SmsTemplateDO | null> {
    const row = await this.prisma.sysSmsTemplate.findUnique({ where: { id } });
    return (row as SmsTemplateDO | null) ?? null;
  }

  /**
   * 根据编号批量查询短信模板
   */
  async selectByIds(ids: number[]): Promise<SmsTemplateDO[]> {
    return this.prisma.sysSmsTemplate.findMany({
      where: { id: { in: ids } },
    }) as Promise<SmsTemplateDO[]>;
  }

  /**
   * 分页查询短信模板
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysSmsTemplateWhereInput,
    orderBy?: Prisma.SysSmsTemplateOrderByWithRelationInput,
  ): Promise<{ list: SmsTemplateDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysSmsTemplate.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysSmsTemplate.count({ where }),
    ]);
    return { list: list as SmsTemplateDO[], total };
  }

  /**
   * 查询短信模板列表（不分页）
   */
  async selectList(where?: Prisma.SysSmsTemplateWhereInput): Promise<SmsTemplateDO[]> {
    return this.prisma.sysSmsTemplate.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<SmsTemplateDO[]>;
  }

  /**
   * 查询精简短信模板列表（id/name/code）
   */
  async selectSimpleList(where?: Prisma.SysSmsTemplateWhereInput): Promise<
    Array<Pick<SmsTemplateDO, 'id' | 'name' | 'code'>>
  > {
    return this.prisma.sysSmsTemplate.findMany({
      where,
      select: this.simpleSelect,
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据条件查询单个短信模板（用于 code 唯一性校验）
   */
  async selectByUnique(where: Prisma.SysSmsTemplateWhereInput): Promise<SmsTemplateDO | null> {
    const row = await this.prisma.sysSmsTemplate.findFirst({ where });
    return (row as SmsTemplateDO | null) ?? null;
  }

  /**
   * 根据渠道编号查询短信渠道编码（channelCode 冗余字段落库用）
   */
  async selectChannelCodeById(channelId: number): Promise<string | null> {
    const channel = await this.prisma.sysSmsChannel.findFirst({
      where: { id: channelId },
      select: { code: true },
    });
    return channel?.code ?? null;
  }

  /**
   * 插入短信模板，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysSmsTemplateUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysSmsTemplate.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新短信模板
   */
  async updateById(
    id: number,
    data: Prisma.SysSmsTemplateUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysSmsTemplate.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个短信模板（释放 code 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个短信模板（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const rows = await this.prisma.sysSmsTemplate.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.sysSmsTemplate.updateMany({
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
