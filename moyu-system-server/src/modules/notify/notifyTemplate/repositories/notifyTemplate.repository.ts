import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { NotifyTemplateDO } from '../entities/notifyTemplate.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 站内信模版管理仓库
 */
@Injectable()
export class NotifyTemplateRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询站内信模版
   */
  async selectById(id: number): Promise<NotifyTemplateDO | null> {
    const row = await this.prisma.sysNotifyTemplate.findUnique({ where: { id } });
    return (row as unknown as NotifyTemplateDO | null) ?? null;
  }

  /**
   * 根据编号批量查询站内信模版
   */
  async selectByIds(ids: number[]): Promise<NotifyTemplateDO[]> {
    const rows = await this.prisma.sysNotifyTemplate.findMany({
      where: { id: { in: ids } },
    });
    return rows as unknown as NotifyTemplateDO[];
  }

  /**
   * 分页查询站内信模版
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysNotifyTemplateWhereInput,
  ): Promise<{ list: NotifyTemplateDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysNotifyTemplate.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysNotifyTemplate.count({ where }),
    ]);
    return { list: rows as unknown as NotifyTemplateDO[], total };
  }

  /**
   * 查询站内信模版列表（不分页）
   */
  async selectList(where?: Prisma.SysNotifyTemplateWhereInput): Promise<NotifyTemplateDO[]> {
    const rows = await this.prisma.sysNotifyTemplate.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as NotifyTemplateDO[];
  }

  /**
   * 根据条件查询单个站内信模版（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysNotifyTemplateWhereInput): Promise<NotifyTemplateDO | null> {
    const row = await this.prisma.sysNotifyTemplate.findFirst({ where });
    return (row as unknown as NotifyTemplateDO | null) ?? null;
  }

  /**
   * 插入站内信模版，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysNotifyTemplateUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysNotifyTemplate.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新站内信模版
   */
  async updateById(
    id: number,
    data: Prisma.SysNotifyTemplateUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysNotifyTemplate.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个站内信模版（释放 code 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个站内信模版（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const rows = await this.prisma.sysNotifyTemplate.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.sysNotifyTemplate.updateMany({
          where: { id: row.id },
          data: {
            code: freeUniqueCode(row.code, row.id, 100),
            deleted: true,
            deletedAt: now,
          },
        });
      }
    });
    return rows.length > 0;
  }
}
