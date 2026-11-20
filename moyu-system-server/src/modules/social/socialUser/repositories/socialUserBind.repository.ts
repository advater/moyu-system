import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SocialUserBindDO } from '../entities/socialUserBind.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 社交用户绑定管理仓库
 */
@Injectable()
export class SocialUserBindRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询绑定关系
   */
  async selectById(id: number): Promise<SocialUserBindDO | null> {
    const row = await this.prisma.sysSocialUserBind.findUnique({ where: { id } });
    return (row as unknown as SocialUserBindDO | null) ?? null;
  }

  /**
   * 查询绑定关系列表（不分页）
   */
  async selectList(where?: Prisma.SysSocialUserBindWhereInput): Promise<SocialUserBindDO[]> {
    const rows = await this.prisma.sysSocialUserBind.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as SocialUserBindDO[];
  }

  /**
   * 根据条件查询单条绑定关系（唯一性校验）
   */
  async selectByUnique(where: Prisma.SysSocialUserBindWhereInput): Promise<SocialUserBindDO | null> {
    const row = await this.prisma.sysSocialUserBind.findFirst({ where });
    return (row as unknown as SocialUserBindDO | null) ?? null;
  }

  /**
   * 插入绑定关系，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysSocialUserBindUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysSocialUserBind.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 软删除绑定关系
   */
  async deleteByWhere(where: Prisma.SysSocialUserBindWhereInput): Promise<boolean> {
    const result = await this.prisma.sysSocialUserBind.updateMany({
      where,
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
