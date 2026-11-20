import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OAuth2CodeDO } from '../entities/oauth2Code.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * OAuth2 授权码管理仓库
 *
 * 授权码一次性使用：取用时须同步删除（删除后 read 层软删除过滤不会再命中）。
 */
@Injectable()
export class OAuth2CodeRepository {
  constructor(private prisma: PrismaService) {}

  /** 根据授权码查询（未删除、未过期的授权码由 service 层判断） */
  async selectByCode(code: string): Promise<OAuth2CodeDO | null> {
    const row = await this.prisma.sysOAuth2Code.findFirst({
      where: { code },
    });
    return (row as OAuth2CodeDO | null) ?? null;
  }

  /** 插入授权码，返回自增编号 */
  async insert(data: TenantCreateInput<Prisma.SysOAuth2CodeUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysOAuth2Code.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /** 根据授权码软删除（一次性使用后作废） */
  async deleteByCode(code: string): Promise<boolean> {
    const result = await this.prisma.sysOAuth2Code.updateMany({
      where: { code },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
