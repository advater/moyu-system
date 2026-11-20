import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  SmsChannelPageReqDTO,
  SmsChannelResDTO,
  SmsChannelSaveReqDTO,
  SmsChannelSimpleResDTO,
} from './dto/smsChannel.dto';
import { SmsChannelRepository } from './repositories/smsChannel.repository';
import { SmsChannelDO } from './entities/smsChannel.entity';
import { Prisma } from '@/generated/prisma/client';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { SmsError } from '@/config/error-messages';
import { maskSecret, shouldKeepExistingSecret } from '@/utils/sanitize';

/**
 * 短信渠道 Service
 */
@Injectable()
export class SmsChannelService {
  constructor(private readonly smsChannelRepository: SmsChannelRepository) {}

  /**
   * 创建短信渠道
   */
  async createSmsChannel(req: SmsChannelSaveReqDTO): Promise<number> {
    // 渠道编码（code）不允许重复
    const exists = await this.smsChannelRepository.selectByUnique({
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        SmsError.CHANNEL_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）；apiSecret 为空时以空串落库（数据库列非空）
    return this.smsChannelRepository.insert({
      signature: req.signature,
      code: req.code,
      status: req.status,
      remark: req.remark ?? null,
      apiKey: req.apiKey,
      apiSecret: req.apiSecret ?? '',
      callbackUrl: req.callbackUrl ?? null,
    });
  }

  /**
   * 修改短信渠道
   */
  async updateSmsChannel(req: SmsChannelSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(SmsError.CHANNEL_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const channel = await this.smsChannelRepository.selectById(req.id);
    if (!channel) {
      throw new HttpException(
        SmsError.CHANNEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 渠道编码唯一（排除自身）
    const conflict = await this.smsChannelRepository.selectByUnique({
      code: req.code,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(
        SmsError.CHANNEL_CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.smsChannelRepository.updateById(req.id, {
      signature: req.signature,
      code: req.code,
      status: req.status,
      remark: req.remark ?? channel.remark,
      apiKey: shouldKeepExistingSecret(req.apiKey) ? channel.apiKey : req.apiKey,
      apiSecret: shouldKeepExistingSecret(req.apiSecret)
        ? channel.apiSecret
        : (req.apiSecret ?? channel.apiSecret),
      callbackUrl: req.callbackUrl ?? channel.callbackUrl,
    });
  }

  /**
   * 删除短信渠道
   */
  async deleteSmsChannel(id: number): Promise<boolean> {
    const channel = await this.smsChannelRepository.selectById(id);
    if (!channel) {
      throw new HttpException(
        SmsError.CHANNEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.smsChannelRepository.deleteById(id);
  }

  /**
   * 批量删除短信渠道
   */
  async deleteSmsChannelList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.smsChannelRepository.deleteBatchIds(ids);
  }

  /**
   * 获取短信渠道详情
   */
  async getSmsChannel(id: number): Promise<SmsChannelResDTO> {
    const channel = await this.smsChannelRepository.selectById(id);
    if (!channel) {
      throw new HttpException(
        SmsError.CHANNEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(channel);
  }

  /**
   * 分页查询短信渠道
   */
  async getSmsChannelPage(
    req: SmsChannelPageReqDTO,
  ): Promise<PageResult<SmsChannelResDTO>> {
    const where: Prisma.SysSmsChannelWhereInput = {
      ...(req.signature ? { signature: { contains: req.signature } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
      // 创建时间范围 [开始时间, 结束时间]
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0].replace(' ', 'T')),
              lte: new Date(req.createTime[1].replace(' ', 'T')),
            },
          }
        : {}),
    };
    const { list, total } = await this.smsChannelRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return {
      list: list.map((channel) => this.toResDTO(channel)),
      total,
    };
  }

  /**
   * 获取短信渠道精简列表（包含被禁用的短信渠道）
   */
  async getSimpleSmsChannelList(): Promise<SmsChannelSimpleResDTO[]> {
    const list = await this.smsChannelRepository.selectSimpleList();
    return list.map((channel) => {
      const resp = new SmsChannelSimpleResDTO();
      resp.id = channel.id;
      resp.signature = channel.signature;
      resp.code = channel.code;
      return resp;
    });
  }

  /**
   * 短信渠道 DO → ResDTO
   */
  private toResDTO(channel: SmsChannelDO): SmsChannelResDTO {
    const resp = new SmsChannelResDTO();
    resp.id = channel.id;
    resp.signature = channel.signature;
    resp.code = channel.code;
    resp.status = channel.status;
    resp.remark = channel.remark ?? undefined;
    resp.apiKey = maskSecret(channel.apiKey);
    resp.apiSecret = maskSecret(channel.apiSecret);
    resp.callbackUrl = channel.callbackUrl ?? undefined;
    resp.createTime = formatDate(channel.createTime);
    return resp;
  }
}
