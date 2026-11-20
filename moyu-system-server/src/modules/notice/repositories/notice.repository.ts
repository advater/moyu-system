import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { NoticeDO } from '../entities/notice.entity';
import { ensureTenantId, TenantCreateInput } from '@/common/tenant/tenant-write';


/**
 * 通知公告管理仓库
 */
@Injectable()
export class NoticeRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询通知公告
   */
  async selectById(id: number): Promise<NoticeDO | null> {
    const row = await this.prisma.sysNotice.findUnique({ where: { id } });
    return (row as NoticeDO | null) ?? null;
  }

  /**
   * 根据编号批量查询通知公告
   */
  async selectByIds(ids: number[]): Promise<NoticeDO[]> {
    return this.prisma.sysNotice.findMany({
      where: { id: { in: ids } },
    }) as Promise<NoticeDO[]>;
  }

  /**
   * 分页查询通知公告
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysNoticeWhereInput,
    orderBy?: Prisma.SysNoticeOrderByWithRelationInput,
  ): Promise<{ list: NoticeDO[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const [list, total] = await Promise.all([
      this.prisma.sysNotice.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: orderBy ?? { createTime: 'desc' },
      }),
      this.prisma.sysNotice.count({ where }),
    ]);
    return { list: list as NoticeDO[], total };
  }

  /**
   * 查询通知公告列表（不分页）
   */
  async selectList(where?: Prisma.SysNoticeWhereInput): Promise<NoticeDO[]> {
    return this.prisma.sysNotice.findMany({
      where,
      orderBy: { createTime: 'desc' },
    }) as Promise<NoticeDO[]>;
  }

  /**
   * 根据条件查询单条通知公告
   */
  async selectByUnique(where: Prisma.SysNoticeWhereInput): Promise<NoticeDO | null> {
    const row = await this.prisma.sysNotice.findFirst({ where });
    return (row as NoticeDO | null) ?? null;
  }

  /**
   * 插入通知公告，返回自增编号
   */
  async insert(data: TenantCreateInput<Prisma.SysNoticeUncheckedCreateInput>): Promise<number> {
    const row = await this.prisma.sysNotice.create({ data: ensureTenantId(data) });
    return row.id;
  }

  /**
   * 根据编号更新通知公告
   */
  async updateById(
    id: number,
    data: Prisma.SysNoticeUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysNotice.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个通知公告
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysNotice.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个通知公告
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    const result = await this.prisma.sysNotice.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
