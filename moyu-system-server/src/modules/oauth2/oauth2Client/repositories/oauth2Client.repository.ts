import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OAuth2ClientDO } from '../entities/oauth2Client.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * OAuth2 客户端管理仓库
 */
@Injectable()
export class OAuth2ClientRepository {
  constructor(private prisma: PrismaService) {}

  /** 根据主键查询（软删除过滤由 PrismaService 全局处理） */
  async selectById(id: number): Promise<OAuth2ClientDO | null> {
    const row = await this.prisma.sysOAuth2Client.findFirst({
      where: { id },
    });
    return (row as OAuth2ClientDO | null) ?? null;
  }

  /** 根据客户端编号查询（唯一索引 uk_oauth2_client_id） */
  async selectByClientId(clientId: string): Promise<OAuth2ClientDO | null> {
    const row = await this.prisma.sysOAuth2Client.findFirst({
      where: { clientId },
    });
    return (row as OAuth2ClientDO | null) ?? null;
  }

  /** 查询客户端列表（不分页） */
  async selectList(
    where?: Prisma.SysOAuth2ClientWhereInput,
  ): Promise<OAuth2ClientDO[]> {
    return this.prisma.sysOAuth2Client.findMany({
      where,
      orderBy: { id: 'desc' },
    }) as Promise<OAuth2ClientDO[]>;
  }

  /** 分页查询客户端 */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysOAuth2ClientWhereInput,
  ): Promise<{ list: OAuth2ClientDO[]; total: number }> {
    const { page, pageSize } = params;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysOAuth2Client.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sysOAuth2Client.count({ where }),
    ]);
    return { list: rows as OAuth2ClientDO[], total };
  }

  /** 插入客户端，返回创建后的记录 */
  async insert(data: TenantCreateInput<Prisma.SysOAuth2ClientUncheckedCreateInput>): Promise<OAuth2ClientDO> {
    const row = await this.prisma.sysOAuth2Client.create({ data: ensureTenantId(data) });
    return row as OAuth2ClientDO;
  }

  /** 根据主键更新客户端（软删除过滤：仅更新未删除记录） */
  async updateById(
    id: number,
    data: Prisma.SysOAuth2ClientUpdateManyMutationInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysOAuth2Client.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /** 根据主键软删除 */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysOAuth2Client.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /** 批量软删除 */
  async deleteByIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const result = await this.prisma.sysOAuth2Client.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
