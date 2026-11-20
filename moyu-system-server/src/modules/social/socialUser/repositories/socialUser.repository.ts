import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { SocialUserDO } from '../entities/socialUser.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 社交用户管理仓库
 */
@Injectable()
export class SocialUserRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询社交用户
   */
  async selectById(id: number): Promise<SocialUserDO | null> {
    const row = await this.prisma.sysSocialUser.findUnique({ where: { id } });
    return (row as unknown as SocialUserDO | null) ?? null;
  }

  /**
   * 根据编号批量查询社交用户
   */
  async selectByIds(ids: number[]): Promise<SocialUserDO[]> {
    const rows = await this.prisma.sysSocialUser.findMany({
      where: { id: { in: ids } },
    });
    return rows as unknown as SocialUserDO[];
  }

  /**
   * 分页查询社交用户
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysSocialUserWhereInput,
  ): Promise<{ list: SocialUserDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysSocialUser.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysSocialUser.count({ where }),
    ]);
    return { list: rows as unknown as SocialUserDO[], total };
  }

  /**
   * 查询社交用户列表（不分页）
   */
  async selectList(where?: Prisma.SysSocialUserWhereInput): Promise<SocialUserDO[]> {
    const rows = await this.prisma.sysSocialUser.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return rows as unknown as SocialUserDO[];
  }

  /**
   * 根据条件查询单个社交用户（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysSocialUserWhereInput): Promise<SocialUserDO | null> {
    const row = await this.prisma.sysSocialUser.findFirst({ where });
    return (row as unknown as SocialUserDO | null) ?? null;
  }

  /**
   * 插入社交用户，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysSocialUserUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysSocialUser.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新社交用户
   */
  async updateById(
    id: number,
    data: Prisma.SysSocialUserUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysSocialUser.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个社交用户
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysSocialUser.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
