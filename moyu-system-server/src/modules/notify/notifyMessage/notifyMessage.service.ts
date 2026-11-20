import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  NotifyMessageMyPageReqDTO,
  NotifyMessagePageReqDTO,
  NotifyMessageResDTO,
} from './dto/notifyMessage.dto';
import { NotifyMessageRepository } from './repositories/notifyMessage.repository';
import { NotifyMessageDO } from './entities/notifyMessage.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { NotifyError } from '@/config/error-messages';
import { toPositiveInt } from '@/utils/to-positive-int';

/**
 * 站内信 Service
 */
@Injectable()
export class NotifyMessageService {
  constructor(
    private readonly notifyMessageRepository: NotifyMessageRepository,
  ) {}

  /**
   * 获取站内信详情
   */
  async getNotifyMessage(id: number): Promise<NotifyMessageResDTO> {
    const message = await this.notifyMessageRepository.selectById(id);
    if (!message) {
      throw new HttpException(
        NotifyError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(message);
  }

  /**
   * 获取站内信分页列表
   */
  async getNotifyMessagePage(
    req: NotifyMessagePageReqDTO,
  ): Promise<PageResult<NotifyMessageResDTO>> {
    const where = {
      ...(req.userId !== undefined ? { userId: req.userId } : {}),
      ...(req.userType !== undefined ? { userType: req.userType } : {}),
      ...(req.templateCode ? { templateCode: { contains: req.templateCode } } : {}),
      ...(req.templateType !== undefined ? { templateType: req.templateType } : {}),
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.notifyMessageRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((message) => this.toResDTO(message)), total };
  }

  /**
   * 获取我的站内信分页列表
   *
   * 处理链路：按 当前登录用户（id + userType）过滤后分页。
   */
  async getMyNotifyMessagePage(
    req: NotifyMessageMyPageReqDTO,
    userId: number,
    userType: number,
  ): Promise<PageResult<NotifyMessageResDTO>> {
    const where: Prisma.SysNotifyMessageWhereInput = {
      userId,
      userType,
      ...(req.readStatus !== undefined ? { readStatus: req.readStatus } : {}),
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.notifyMessageRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((message) => this.toResDTO(message)), total };
  }

  /**
   * 标记站内信为已读
   *
   * 处理链路：按 当前登录用户 + 站内信编号集合 置为已读。
   */
  async updateNotifyMessageRead(
    ids: number[] | string | number,
    userId: number,
    userType: number,
  ): Promise<boolean> {
    return (await this.notifyMessageRepository.markMyRead(ids, userId, userType)) > 0;
  }

  /**
   * 标记所有站内信为已读
   *
   * 处理链路：将 当前登录用户 的全部未读站内信置为已读。
   */
  async updateAllNotifyMessageRead(
    userId: number,
    userType: number,
  ): Promise<boolean> {
    return (await this.notifyMessageRepository.markMyAllRead(userId, userType)) > 0;
  }

  /**
   * 获取当前用户的最新未读站内信列表
   */
  async getUnreadNotifyMessageList(
    size: number | string | undefined,
    userId: number,
    userType: number,
  ): Promise<NotifyMessageResDTO[]> {
    const list = await this.notifyMessageRepository.selectMyUnreadList(
      userId,
      userType,
      toPositiveInt(size, 10),
    );
    return list.map((message) => this.toResDTO(message));
  }

  /**
   * 获取当前用户的未读站内信数量
   */
  async getUnreadNotifyMessageCount(
    userId: number,
    userType: number,
  ): Promise<number> {
    return this.notifyMessageRepository.selectMyUnreadCount(userId, userType);
  }

  /**
   * 站内信 DO → ResDTO
   */
  private toResDTO(message: NotifyMessageDO): NotifyMessageResDTO {
    const resp = new NotifyMessageResDTO();
    resp.id = message.id;
    resp.userId = message.userId;
    resp.userType = message.userType;
    resp.templateId = message.templateId;
    resp.templateCode = message.templateCode;
    resp.templateNickname = message.templateNickname ?? '';
    resp.templateContent = message.templateContent;
    resp.templateType = message.templateType;
    resp.templateParams = message.templateParams ?? {};
    resp.readStatus = message.readStatus;
    resp.readTime = message.readTime ? formatDate(message.readTime) : undefined;
    resp.createTime = formatDate(message.createTime);
    return resp;
  }
}
