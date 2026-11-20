import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { PostDO } from '../entities/post.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';
import { freeUniqueCode } from '@/utils/soft-delete-code';


/**
 * 岗位管理仓库
 */
@Injectable()
export class PostRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询岗位
   */
  async selectById(id: number): Promise<PostDO | null> {
    const row = await this.prisma.sysPost.findUnique({ where: { id } });
    return (row as PostDO | null) ?? null;
  }

  /**
   * 根据编号批量查询岗位
   */
  async selectByIds(ids: number[]): Promise<PostDO[]> {
    return this.prisma.sysPost.findMany({
      where: { id: { in: ids } },
    }) as Promise<PostDO[]>;
  }

  /**
   * 分页查询岗位
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysPostWhereInput,
    orderBy?: Prisma.SysPostOrderByWithRelationInput,
  ): Promise<{ list: PostDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.sysPost.findMany({
        where,
        orderBy: orderBy ?? { sort: 'asc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.sysPost.count({ where }),
    ]);
    return { list: rows as PostDO[], total };
  }

  /**
   * 查询岗位列表（不分页）
   */
  async selectList(where?: Prisma.SysPostWhereInput): Promise<PostDO[]> {
    return this.prisma.sysPost.findMany({
      where,
      orderBy: { sort: 'asc' },
    }) as Promise<PostDO[]>;
  }

  /**
   * 根据条件查询单个岗位（用于唯一性校验）
   */
  async selectByUnique(where: Prisma.SysPostWhereInput): Promise<PostDO | null> {
    const row = await this.prisma.sysPost.findFirst({ where });
    return (row as PostDO | null) ?? null;
  }

  /**
   * 插入岗位，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysPostUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysPost.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新岗位
   */
  async updateById(
    id: number,
    data: Prisma.SysPostUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysPost.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个岗位（释放 code 唯一约束）
   */
  async deleteById(id: number): Promise<boolean> {
    return this.deleteBatchIds([id]);
  }

  /**
   * 软删除多个岗位（释放 code 唯一约束）
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const now = new Date();
    const posts = await this.prisma.sysPost.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const post of posts) {
        await tx.sysPost.updateMany({
          where: { id: post.id },
          data: {
            code: freeUniqueCode(post.code, post.id, 64),
            deleted: true,
            deletedAt: now,
          },
        });
      }
    });
    return posts.length > 0;
  }
}
