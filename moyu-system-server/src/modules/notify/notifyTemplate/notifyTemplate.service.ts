import { Injectable, HttpException, HttpStatus, Optional } from '@nestjs/common';
import {
  NotifyTemplatePageReqDTO,
  NotifyTemplateResDTO,
  NotifyTemplateSaveReqDTO,
  NotifyTemplateSendReqDTO,
  NotifyTemplateSimpleResDTO,
} from './dto/notifyTemplate.dto';
import { NotifyTemplateRepository } from './repositories/notifyTemplate.repository';
import { NotifyMessageRepository } from '../notifyMessage/repositories/notifyMessage.repository';
import { NotifyTemplateDO } from './entities/notifyTemplate.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, NotifyError } from '@/config/error-messages';
import { i18nKey } from '@/i18n';
import { NoticeWsGateway } from '@/modules/notice/notice-ws.gateway';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

/**
 * 站内信模版 Service
 */
@Injectable()
export class NotifyTemplateService {
  constructor(
    private readonly notifyTemplateRepository: NotifyTemplateRepository,
    private readonly notifyMessageRepository: NotifyMessageRepository,
    @Optional() private readonly noticeWsGateway?: NoticeWsGateway,
  ) {}

  /**
   * 创建站内信模版
   */
  async createNotifyTemplate(req: NotifyTemplateSaveReqDTO): Promise<number> {
    // 模版编码不允许重复
    const exists = await this.notifyTemplateRepository.selectByUnique({
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        NotifyError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.notifyTemplateRepository.insert({
      name: req.name,
      code: req.code,
      type: req.type,
      nickname: req.nickname ?? null,
      content: req.content,
      status: req.status,
      remark: req.remark ?? null,
    });
  }

  /**
   * 修改站内信模版
   */
  async updateNotifyTemplate(req: NotifyTemplateSaveReqDTO): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const template = await this.notifyTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        NotifyError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 模版编码唯一（排除自身）
    const conflict = await this.notifyTemplateRepository.selectByUnique({
      code: req.code,
      id: { not: id },
    });
    if (conflict) {
      throw new HttpException(
        NotifyError.TEMPLATE_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.notifyTemplateRepository.updateById(id, {
      name: req.name,
      code: req.code,
      type: req.type,
      nickname: req.nickname ?? template.nickname,
      content: req.content,
      status: req.status,
      remark: req.remark ?? template.remark,
    });
  }

  /**
   * 删除站内信模版
   */
  async deleteNotifyTemplate(id: number): Promise<boolean> {
    const template = await this.notifyTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        NotifyError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.notifyTemplateRepository.deleteById(id);
  }

  /**
   * 批量删除站内信模版
   */
  async deleteNotifyTemplateList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.notifyTemplateRepository.deleteBatchIds(ids);
  }

  /**
   * 获取站内信模版详情
   */
  async getNotifyTemplate(id: number): Promise<NotifyTemplateResDTO> {
    const template = await this.notifyTemplateRepository.selectById(id);
    if (!template) {
      throw new HttpException(
        NotifyError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(template);
  }

  /**
   * 获取站内信模版分页列表
   */
  async getNotifyTemplatePage(
    req: NotifyTemplatePageReqDTO,
  ): Promise<PageResult<NotifyTemplateResDTO>> {
    const where = {
      ...(req.code ? { code: { contains: req.code } } : {}),
      ...(req.name ? { name: { contains: req.name } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.notifyTemplateRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((template) => this.toResDTO(template)), total };
  }

  /**
   * 获取站内信模版精简列表（仅启用，用于下拉选项）
   */
  async getSimpleNotifyTemplateList(): Promise<NotifyTemplateSimpleResDTO[]> {
    const list = await this.notifyTemplateRepository.selectList({ status: 1 });
    return list.map((template) => {
      const resp = new NotifyTemplateSimpleResDTO();
      resp.id = template.id;
      resp.name = template.name;
      resp.code = template.code;
      return resp;
    });
  }

  /**
   * 发送站内信
   *
   * 处理链路：按编码加载模版 → 校验参数完整性 → 格式化内容 → 写入站内信消息。
   */
  async sendNotify(req: NotifyTemplateSendReqDTO): Promise<number> {
    const template = await this.notifyTemplateRepository.selectByUnique({
      code: req.templateCode,
      deleted: false,
    });
    if (!template) {
      throw new HttpException(
        NotifyError.TEMPLATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 校验模版声明的参数是否都传了
    const requiredKeys = (template.params ?? []) as string[];
    const params = req.templateParams ?? {};
    const missingKey = requiredKeys.find(
      (key) => !Object.prototype.hasOwnProperty.call(params, key),
    );
    if (missingKey) {
      throw new HttpException(
        i18nKey(NotifyError.SEND_TEMPLATE_PARAM_MISS, {
          key: missingKey,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
    const id = await this.notifyMessageRepository.insert({
      userId: req.userId,
      userType: req.userType,
      templateId: template.id,
      templateCode: template.code,
      templateType: template.type,
      templateNickname: template.nickname ?? '',
      templateContent: this.formatContent(template.content, params),
      templateParams: params,
    });
    try {
      const count = await this.notifyMessageRepository.selectMyUnreadCount(
        req.userId,
        req.userType,
      );
      this.noticeWsGateway?.pushUnreadCount(
        req.userId,
        TenantContext.getTenantId() || DEFAULT_TENANT_ID,
        count,
      );
    } catch {
      /* ignore push failure */
    }
    return id;
  }

  /**
   * 使用参数渲染模版内容中的 {key} 占位符
   */
  private formatContent(
    content: string,
    params: Record<string, any>,
  ): string {
    if (!content) return '';
    return content.replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(params, key)
        ? String(params[key])
        : match,
    );
  }

  /**
   * 站内信模版 DO → ResDTO
   */
  private toResDTO(template: NotifyTemplateDO): NotifyTemplateResDTO {
    const resp = new NotifyTemplateResDTO();
    resp.id = template.id;
    resp.name = template.name;
    resp.code = template.code;
    resp.type = template.type;
    resp.nickname = template.nickname ?? '';
    resp.content = template.content;
    resp.params = (template.params as string[] | null) ?? undefined;
    resp.status = template.status;
    resp.remark = template.remark ?? undefined;
    resp.createTime = formatDate(template.createTime);
    return resp;
  }
}
