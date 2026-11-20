import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { NoticeError } from '@/config/error-messages';
import {
  NoticePageReqDTO,
  NoticeResDTO,
  NoticeSaveReqDTO,
} from './dto/notice.dto';
import { NoticeRepository } from './repositories/notice.repository';
import { NoticeWsGateway } from './notice-ws.gateway';
import { NoticeDO } from './entities/notice.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { TenantContext } from '@/common/tenant/tenant.context';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * 通知公告管理 Service
 */
@Injectable()
export class NoticeService {
  constructor(
    private readonly noticeRepository: NoticeRepository,
    private readonly noticeWsGateway: NoticeWsGateway,
    private readonly prisma: PrismaService,
  ) {}

  async createNotice(req: NoticeSaveReqDTO): Promise<number> {
    return this.noticeRepository.insert({
      title: req.title,
      type: req.type,
      content: req.content,
      status: req.status,
      targetDeptIds: req.targetDeptIds ?? [],
      targetRoleIds: req.targetRoleIds ?? [],
      publishTime: req.publishTime ? new Date(req.publishTime) : null,
    });
  }

  async updateNotice(req: NoticeSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(NoticeError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const notice = await this.noticeRepository.selectById(req.id);
    if (!notice) {
      throw new HttpException(NoticeError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.noticeRepository.updateById(req.id, {
      title: req.title,
      type: req.type,
      content: req.content,
      status: req.status,
      targetDeptIds: req.targetDeptIds ?? [],
      targetRoleIds: req.targetRoleIds ?? [],
      publishTime: req.publishTime ? new Date(req.publishTime) : null,
    });
  }

  async deleteNotice(id: number): Promise<boolean> {
    const notice = await this.noticeRepository.selectById(id);
    if (!notice) {
      throw new HttpException(NoticeError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.noticeRepository.deleteById(id);
  }

  async deleteNoticeList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.noticeRepository.deleteBatchIds(ids);
  }

  async getNoticePage(req: NoticePageReqDTO): Promise<PageResult<NoticeResDTO>> {
    const { list, total } = await this.noticeRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.title ? { title: { contains: req.title } } : {}),
        ...(req.status !== undefined ? { status: req.status } : {}),
      },
    );
    return {
      list: list.map((notice) => this.toResDTO(notice)),
      total,
    };
  }

  async getNotice(id: number): Promise<NoticeResDTO> {
    const notice = await this.noticeRepository.selectById(id);
    if (!notice) {
      throw new HttpException(NoticeError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(notice);
  }

  /**
   * 推送通知公告（按定向部门/角色过滤在线用户；皆空则租户内全员）
   */
  async pushNotice(id: number): Promise<boolean> {
    const notice = await this.noticeRepository.selectById(id);
    if (!notice) {
      throw new HttpException(NoticeError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (notice.publishTime && notice.publishTime.getTime() > Date.now()) {
      throw new HttpException(
        NoticeError.NOT_DUE,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tenantId = TenantContext.getTenantId() ?? undefined;
    const userIds = await this.resolveTargetUserIds(notice);
    this.noticeWsGateway.broadcastNotice(
      this.toResDTO(notice),
      tenantId,
      userIds,
    );
    return true;
  }

  /** 解析定向用户：部门并集 + 角色并集；皆空返回 undefined（全员） */
  private async resolveTargetUserIds(
    notice: NoticeDO,
  ): Promise<number[] | undefined> {
    const deptIds = Array.isArray(notice.targetDeptIds)
      ? notice.targetDeptIds.map(Number).filter((n) => Number.isFinite(n))
      : [];
    const roleIds = Array.isArray(notice.targetRoleIds)
      ? notice.targetRoleIds.map(Number).filter((n) => Number.isFinite(n))
      : [];
    if (deptIds.length === 0 && roleIds.length === 0) {
      return undefined;
    }
    const idSet = new Set<number>();
    if (deptIds.length > 0) {
      const users = await this.prisma.sysUser.findMany({
        where: { deptId: { in: deptIds } },
        select: { id: true },
      });
      users.forEach((u) => idSet.add(u.id));
    }
    if (roleIds.length > 0) {
      const binds = await this.prisma.sysUserRole.findMany({
        where: { roleId: { in: roleIds } },
        select: { userId: true },
      });
      binds.forEach((b) => idSet.add(b.userId));
    }
    return [...idSet];
  }

  private toResDTO(notice: NoticeDO): NoticeResDTO {
    const resp = new NoticeResDTO();
    resp.id = notice.id;
    resp.title = notice.title;
    resp.type = notice.type;
    resp.content = notice.content;
    resp.status = notice.status;
    resp.targetDeptIds = Array.isArray(notice.targetDeptIds)
      ? notice.targetDeptIds.map(Number)
      : [];
    resp.targetRoleIds = Array.isArray(notice.targetRoleIds)
      ? notice.targetRoleIds.map(Number)
      : [];
    resp.publishTime = notice.publishTime
      ? formatDate(notice.publishTime)
      : undefined;
    resp.createTime = formatDate(notice.createTime);
    return resp;
  }
}
