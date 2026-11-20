import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { MailAccountDO } from '../entities/mailAccount.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 邮箱账号行数据
 *
 * 注意：MailAccountDO 中的 ssl_enable/starttls_enable 是历史遗留的数据库列名写法，
 * Prisma 模型 SysMailAccount 的属性为 sslEnable/starttlsEnable（经 @map 映射到列），
 * 因此仓库/Service 层以 Prisma 模型属性为准定义行类型。
 */
export type MailAccountRow = Omit<
  MailAccountDO,
  'ssl_enable' | 'starttls_enable'
> & {
  sslEnable: boolean;
  starttlsEnable: boolean;
  deletedAt: Date | null;
};

/**
 * 邮件账号管理仓库
 */
@Injectable()
export class MailAccountRepository {
  constructor(private prisma: PrismaService) {}

  /** 邮箱账号字段（不含软删/审计，用于精简查询） */
  private readonly simpleSelect: Prisma.SysMailAccountSelect = {
    id: true,
    mail: true,
  };

  /**
   * 根据编号查询邮箱账号
   */
  async selectById(id: number): Promise<MailAccountRow | null> {
    const row = await this.prisma.sysMailAccount.findUnique({ where: { id } });
    return (row as MailAccountRow | null) ?? null;
  }

  /**
   * 根据编号批量查询邮箱账号
   */
  async selectByIds(ids: number[]): Promise<MailAccountRow[]> {
    return this.prisma.sysMailAccount.findMany({
      where: { id: { in: ids } },
    }) as Promise<MailAccountRow[]>;
  }

  /**
   * 分页查询邮箱账号
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysMailAccountWhereInput,
    orderBy?: Prisma.SysMailAccountOrderByWithRelationInput,
  ): Promise<{ list: MailAccountRow[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysMailAccount.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysMailAccount.count({ where }),
    ]);
    return { list: list as MailAccountRow[], total };
  }

  /**
   * 查询邮箱账号列表（不分页）
   */
  async selectList(where?: Prisma.SysMailAccountWhereInput): Promise<MailAccountRow[]> {
    return this.prisma.sysMailAccount.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<MailAccountRow[]>;
  }

  /**
   * 查询精简邮箱账号列表（id/mail）
   */
  async selectSimpleList(
    where?: Prisma.SysMailAccountWhereInput,
  ): Promise<Array<Pick<MailAccountRow, 'id' | 'mail'>>> {
    return this.prisma.sysMailAccount.findMany({
      where,
      select: this.simpleSelect,
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据条件查询单个邮箱账号（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysMailAccountWhereInput): Promise<MailAccountRow | null> {
    const row = await this.prisma.sysMailAccount.findFirst({ where });
    return (row as MailAccountRow | null) ?? null;
  }

  /**
   * 插入邮箱账号，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysMailAccountUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysMailAccount.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新邮箱账号
   */
  async updateById(
    id: number,
    data: Prisma.SysMailAccountUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysMailAccount.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个邮箱账号
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysMailAccount.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个邮箱账号
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysMailAccount.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
