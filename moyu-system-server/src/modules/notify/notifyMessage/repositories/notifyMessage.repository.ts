import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { NotifyMessageDO } from '../entities/notifyMessage.entity';
import { ensureTenantId } from '@/common/tenant/tenant-write';
import { toIntArray, toPositiveInt } from '@/utils/to-positive-int';


/**
 * 站内信管理仓库
 */
@Injectable()
export class NotifyMessageRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询站内信
   */
  async selectById(id: number): Promise<NotifyMessageDO | null> {
    const row = await this.prisma.sysNotifyMessage.findUnique({ where: { id } });
    return (row as unknown as NotifyMessageDO | null) ?? null;
  }

  /**
   * 分页查询站内信
   */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysNotifyMessageWhereInput,
  ): Promise<{ list: NotifyMessageDO[]; total: number }> {
    const page = toPositiveInt(params.page, 1, 10_000);
    const pageSize = toPositiveInt(params.pageSize, 20);
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysNotifyMessage.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.sysNotifyMessage.count({ where }),
    ]);
    return { list: rows as unknown as NotifyMessageDO[], total };
  }

  /**
   * 插入站内信，返回自增编号
   *
   * @param data templateParams 由仓储侧收敛为 JSON 输入类型
   */
  async insert(data: {
    userId: number;
    userType: number;
    templateId: number;
    templateCode: string;
    templateType: number;
    templateNickname?: string;
    templateContent: string;
    templateParams?: Record<string, any>;
  }): Promise<number> {
    const row = await this.prisma.sysNotifyMessage.create({
      data: ensureTenantId({
        userId: data.userId,
        userType: data.userType,
        templateId: data.templateId,
        templateCode: data.templateCode,
        templateType: data.templateType,
        templateNickname: data.templateNickname ?? null,
        templateContent: data.templateContent,
        templateParams: data.templateParams ??
          {},
      }),
    });
    return row.id;
  }

  /**
   * 按「当前用户 + 指定站内信编号」标记为已读（仅限归属当前用户的未读消息）
   */
  async markMyRead(
    ids: number[] | string | number,
    userId: number,
    userType: number,
  ): Promise<number> {
    const idList = toIntArray(ids);
    if (idList.length === 0) {
      return 0;
    }
    const result = await this.prisma.sysNotifyMessage.updateMany({
      where: {
        id: { in: idList },
        userId,
        userType,
        readStatus: false,
      },
      data: { readStatus: true },
    });
    return result.count;
  }

  /**
   * 将当前用户的全部未读站内信标记为已读
   */
  async markMyAllRead(userId: number, userType: number): Promise<number> {
    const result = await this.prisma.sysNotifyMessage.updateMany({
      where: { userId, userType, readStatus: false },
      data: { readStatus: true },
    });
    return result.count;
  }

  /**
   * 查询当前用户最新未读站内信列表（按创建时间倒序）
   */
  async selectMyUnreadList(
    userId: number,
    userType: number,
    limit: number,
  ): Promise<NotifyMessageDO[]> {
    const rows = await this.prisma.sysNotifyMessage.findMany({
      where: { userId, userType, readStatus: false },
      orderBy: { id: 'desc' },
      take: toPositiveInt(limit, 10),
    });
    return rows as unknown as NotifyMessageDO[];
  }

  /**
   * 查询当前用户未读站内信数量
   */
  async selectMyUnreadCount(userId: number, userType: number): Promise<number> {
    return this.prisma.sysNotifyMessage.count({
      where: { userId, userType, readStatus: false },
    });
  }
}
