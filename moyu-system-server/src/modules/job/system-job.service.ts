import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { TenantContext } from '@/common/tenant/tenant.context';
import { NoticeWsGateway } from '@/modules/notice/notice-ws.gateway';
import { formatDate } from '@/utils/date';

/**
 * 内置任务处理器实现（由 JobScheduler 按 handlerName 调用）
 */
@Injectable()
export class SystemJobService {
  private readonly logger = new Logger(SystemJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly noticeWsGateway: NoticeWsGateway,
  ) {}

  async cleanExpiredTokens(): Promise<string> {
    const now = new Date();
    return TenantContext.run({ tenantId: null, ignore: true }, async () => {
      const access = await this.prisma.sysOAuth2AccessToken.updateMany({
        where: { expiresTime: { lt: now }, deleted: false },
        data: { deleted: true, deletedAt: now },
      });
      const refresh = await this.prisma.sysOAuth2RefreshToken.updateMany({
        where: { expiresTime: { lt: now }, deleted: false },
        data: { deleted: true, deletedAt: now },
      });
      const codes = await this.prisma.sysOAuth2Code.updateMany({
        where: { expiresTime: { lt: now }, deleted: false },
        data: { deleted: true, deletedAt: now },
      });
      const msg = `access=${access.count} refresh=${refresh.count} code=${codes.count}`;
      if (access.count || refresh.count || codes.count) {
        this.logger.log(`清理过期令牌 ${msg}`);
      }
      return msg;
    });
  }

  async cleanOldLogs(): Promise<string> {
    const days = Number(process.env.LOG_RETENTION_DAYS || 180);
    const retention = Number.isFinite(days) && days > 0 ? days : 180;
    const cutoff = new Date(Date.now() - retention * 24 * 60 * 60 * 1000);
    return TenantContext.run({ tenantId: null, ignore: true }, async () => {
      const login = await this.prisma.sysLoginLog.updateMany({
        where: { createTime: { lt: cutoff }, deleted: false },
        data: { deleted: true, deletedAt: new Date() },
      });
      const operate = await this.prisma.sysOperateLog.updateMany({
        where: { createTime: { lt: cutoff }, deleted: false },
        data: { deleted: true, deletedAt: new Date() },
      });
      const access = await this.prisma.sysApiAccessLog.deleteMany({
        where: { createTime: { lt: cutoff } },
      });
      const error = await this.prisma.sysApiErrorLog.deleteMany({
        where: { createTime: { lt: cutoff } },
      });
      const msg = `login=${login.count} operate=${operate.count} apiAccess=${access.count} apiError=${error.count}`;
      if (login.count || operate.count || access.count || error.count) {
        this.logger.log(`清理超期日志(>${retention}d) ${msg}`);
      }
      return msg;
    });
  }

  /** 推送已到计划时间的公告，并清空 publishTime 防重复 */
  async publishDueNotices(): Promise<string> {
    const now = new Date();
    return TenantContext.run({ tenantId: null, ignore: true }, async () => {
      const due = await this.prisma.sysNotice.findMany({
        where: {
          status: 1,
          publishTime: { lte: now },
        },
        take: 50,
        orderBy: { publishTime: 'asc' },
      });
      let pushed = 0;
      for (const notice of due) {
        await TenantContext.run(
          { tenantId: notice.tenantId, ignore: false },
          async () => {
            const userIds = await this.resolveNoticeUserIds(notice);
            this.noticeWsGateway.broadcastNotice(
              {
                id: notice.id,
                title: notice.title,
                type: notice.type,
                content: notice.content,
                status: notice.status,
                targetDeptIds: Array.isArray(notice.targetDeptIds)
                  ? (notice.targetDeptIds as number[])
                  : [],
                targetRoleIds: Array.isArray(notice.targetRoleIds)
                  ? (notice.targetRoleIds as number[])
                  : [],
                publishTime: notice.publishTime
                  ? formatDate(notice.publishTime)
                  : undefined,
                createTime: formatDate(notice.createTime),
              },
              notice.tenantId,
              userIds,
            );
            await this.prisma.sysNotice.update({
              where: { id: notice.id },
              data: { publishTime: null },
            });
            pushed += 1;
          },
        );
      }
      if (pushed) this.logger.log(`定时推送公告 ${pushed} 条`);
      return `pushed=${pushed}`;
    });
  }

  private async resolveNoticeUserIds(notice: {
    targetDeptIds: unknown;
    targetRoleIds: unknown;
  }): Promise<number[] | undefined> {
    const deptIds = Array.isArray(notice.targetDeptIds)
      ? notice.targetDeptIds.map(Number).filter((n) => Number.isFinite(n))
      : [];
    const roleIds = Array.isArray(notice.targetRoleIds)
      ? notice.targetRoleIds.map(Number).filter((n) => Number.isFinite(n))
      : [];
    if (!deptIds.length && !roleIds.length) return undefined;
    const idSet = new Set<number>();
    if (deptIds.length) {
      const users = await this.prisma.sysUser.findMany({
        where: { deptId: { in: deptIds } },
        select: { id: true },
      });
      users.forEach((u) => idSet.add(u.id));
    }
    if (roleIds.length) {
      const binds = await this.prisma.sysUserRole.findMany({
        where: { roleId: { in: roleIds } },
        select: { userId: true },
      });
      binds.forEach((b) => idSet.add(b.userId));
    }
    return [...idSet];
  }
}
