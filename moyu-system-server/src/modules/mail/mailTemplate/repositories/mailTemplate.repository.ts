import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { MailTemplate } from '../entities/mailTemplate.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 邮件模版管理仓库
 */
@Injectable()
export class MailTemplateRepository {
  constructor(private prisma: PrismaService) {}

  /** 精简字段（simple-list 使用） */
  private readonly simpleSelect: Prisma.SysMailTemplateSelect = {
    id: true,
    name: true,
    code: true,
  };

  /**
   * 根据编号查询邮件模版
   */
  async selectById(id: number): Promise<MailTemplate | null> {
    const row = await this.prisma.sysMailTemplate.findUnique({ where: { id } });
    return (row as MailTemplate | null) ?? null;
  }

  /**
   * 根据编号批量查询邮件模版
   */
  async selectByIds(ids: number[]): Promise<MailTemplate[]> {
    return this.prisma.sysMailTemplate.findMany({
      where: { id: { in: ids } },
    }) as Promise<MailTemplate[]>;
  }

  /**
   * 分页查询邮件模版
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysMailTemplateWhereInput,
    orderBy?: Prisma.SysMailTemplateOrderByWithRelationInput,
  ): Promise<{ list: MailTemplate[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysMailTemplate.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysMailTemplate.count({ where }),
    ]);
    return { list: list as MailTemplate[], total };
  }

  /**
   * 查询邮件模版列表（不分页）
   */
  async selectList(where?: Prisma.SysMailTemplateWhereInput): Promise<MailTemplate[]> {
    return this.prisma.sysMailTemplate.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<MailTemplate[]>;
  }

  /**
   * 查询精简邮件模版列表（id/name/code）
   */
  async selectSimpleList(where?: Prisma.SysMailTemplateWhereInput): Promise<
    Array<Pick<MailTemplate, 'id' | 'name' | 'code'>>
  > {
    return this.prisma.sysMailTemplate.findMany({
      where,
      select: this.simpleSelect,
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据条件查询单条邮件模版（用于 code 唯一性校验）
   */
  async selectByUnique(where: Prisma.SysMailTemplateWhereInput): Promise<MailTemplate | null> {
    const row = await this.prisma.sysMailTemplate.findFirst({ where });
    return (row as MailTemplate | null) ?? null;
  }

  /**
   * 插入邮件模版，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysMailTemplateUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysMailTemplate.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新邮件模版
   */
  async updateById(
    id: number,
    data: Prisma.SysMailTemplateUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysMailTemplate.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个邮件模版（释放 code 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个邮件模版（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const rows = await this.prisma.sysMailTemplate.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.sysMailTemplate.updateMany({
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
