import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ExportError, SmsError } from '@/config/error-messages';
import { Prisma } from '@/generated/prisma/client';
import { SmsLogPageReqDTO, SmsLogResDTO } from './dto/smsLog.dto';
import { SmsLogRepository } from './repositories/smsLog.repository';
import { SmsLogDO } from './entities/smsLog.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';

/**
 * 短信日志管理 Service
 *
 * 日志类模块整体「写 + 只读查询」，不对业务开放常规 update/delete；
 * 仅提供发送/接收结果回写（updateSmsSendResult / updateSmsReceiveResult）
 * 供真实发送链路与厂商状态回调使用。
 */
@Injectable()
export class SmsLogService {
  constructor(private readonly smsLogRepository: SmsLogRepository) {}

  /**
   * 新增短信日志（供短信发送后调用），返回插入行
   */
  async createSmsLog(
    data: Prisma.SysSmsLogUncheckedCreateInput,
  ): Promise<SmsLogDO> {
    return this.smsLogRepository.insert(data);
  }

  /**
   * 获取短信日志详情
   */
  async getSmsLog(id: number): Promise<SmsLogResDTO> {
    const log = await this.smsLogRepository.selectById(id);
    if (!log) {
      throw new HttpException(SmsError.LOG_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(log);
  }

  /**
   * 分页查询短信日志
   */
  async getSmsLogPage(
    req: SmsLogPageReqDTO,
  ): Promise<PageResult<SmsLogResDTO>> {
    const where: Prisma.SysSmsLogWhereInput = {
      ...(req.channelId !== undefined ? { channelId: req.channelId } : {}),
      ...(req.templateId !== undefined ? { templateId: req.templateId } : {}),
      // 手机号模糊匹配
      ...(req.mobile ? { mobile: { contains: req.mobile } } : {}),
      ...(req.sendStatus !== undefined ? { sendStatus: req.sendStatus } : {}),
      // 发送时间范围 [开始时间, 结束时间]
      ...(req.sendTime && req.sendTime.length === 2
        ? {
            sendTime: {
              gte: new Date(req.sendTime[0].replace(' ', 'T')),
              lte: new Date(req.sendTime[1].replace(' ', 'T')),
            },
          }
        : {}),
      ...(req.receiveStatus !== undefined
        ? { receiveStatus: req.receiveStatus }
        : {}),
      // 接收时间范围 [开始时间, 结束时间]
      ...(req.receiveTime && req.receiveTime.length === 2
        ? {
            receiveTime: {
              gte: new Date(req.receiveTime[0].replace(' ', 'T')),
              lte: new Date(req.receiveTime[1].replace(' ', 'T')),
            },
          }
        : {}),
    };
    const { list, total } = await this.smsLogRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return {
      list: list.map((log) => this.toResDTO(log)),
      total,
    };
  }

  /**
   * 导出短信日志 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.smsLogRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((log) => ({
      id: log.id,
      mobile: log.mobile,
      channelCode: log.channelCode,
      templateCode: log.templateCode,
      sendStatus: log.sendStatus,
      createTime: formatDate(log.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.SMS_LOG),
      filename: `${xl(ExportError.SMS_LOG)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.MOBILE), key: 'mobile', width: 16 },
        { header: xl(ExportError.CHANNEL_CODE), key: 'channelCode', width: 16 },
        { header: xl(ExportError.TEMPLATE_CODE), key: 'templateCode', width: 18 },
        { header: xl(ExportError.SEND_STATUS), key: 'sendStatus', width: 12 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  // ─── 发送/接收结果回写（仅供真实发送链路与厂商状态回调调用） ─────────

  /**
   * 回写短信「发送结果」
   *
   * 发送状态约定（sendStatus）：0=初始化，10=成功，20=失败。
   * 仅当 API 可选字段有值时写入，避免覆盖历史值（如失败场景可能拿不到
   * apiRequestId / apiSerialNo）。
   */
  async updateSmsSendResult(
    id: number,
    result: {
      sendStatus: number;
      sendTime: Date;
      apiSendCode?: string;
      apiSendMsg?: string;
      apiRequestId?: string;
      apiSerialNo?: string;
    },
  ): Promise<boolean> {
    const data: Prisma.SysSmsLogUncheckedUpdateInput = {
      sendStatus: result.sendStatus,
      sendTime: result.sendTime,
    };
    if (result.apiSendCode !== undefined) {
      data.apiSendCode = result.apiSendCode;
    }
    if (result.apiSendMsg !== undefined) {
      data.apiSendMsg = result.apiSendMsg;
    }
    if (result.apiRequestId !== undefined) {
      data.apiRequestId = result.apiRequestId;
    }
    if (result.apiSerialNo !== undefined) {
      data.apiSerialNo = result.apiSerialNo;
    }
    return this.smsLogRepository.updateById(id, data);
  }

  /**
   * 回写短信「接收结果」
   *
   * 接收状态约定（receiveStatus）：0=未知，10=成功，20=失败。
   * 仅当 API 可选字段有值时写入，避免覆盖历史值。
   */
  async updateSmsReceiveResult(
    id: number,
    result: {
      receiveStatus: number;
      receiveTime: Date;
      apiReceiveCode?: string;
      apiReceiveMsg?: string;
    },
  ): Promise<boolean> {
    const data: Prisma.SysSmsLogUncheckedUpdateInput = {
      receiveStatus: result.receiveStatus,
      receiveTime: result.receiveTime,
    };
    if (result.apiReceiveCode !== undefined) {
      data.apiReceiveCode = result.apiReceiveCode;
    }
    if (result.apiReceiveMsg !== undefined) {
      data.apiReceiveMsg = result.apiReceiveMsg;
    }
    return this.smsLogRepository.updateById(id, data);
  }

  /**
   * 根据平台发送序号（apiSerialNo）查询短信日志
   *
   * 供厂商状态回调「按序号精确匹配」使用；序号非唯一索引，多条时取最新一条。
   */
  async selectByApiSerialNo(serialNo: string): Promise<SmsLogDO | null> {
    if (!serialNo) {
      return null;
    }
    const list = await this.smsLogRepository.selectList({
      apiSerialNo: serialNo,
    });
    return list[0] ?? null;
  }

  /**
   * 查询指定手机号在最近 N 小时内「发送成功（sendStatus=10）」的短信日志，取最新一条
   *
   * 供厂商状态回调在无 apiSerialNo 时「按手机号 + 发送成功后 24h 窗口」兜底匹配使用。
   */
  async selectLatestByMobile(
    mobile: string,
    withinHours = 24,
  ): Promise<SmsLogDO | null> {
    if (!mobile) {
      return null;
    }
    const gte = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const list = await this.smsLogRepository.selectList({
      mobile,
      sendStatus: 10,
      createTime: { gte },
    });
    return list[0] ?? null;
  }

  /**
   * 短信日志 DO → ResDTO
   */
  private toResDTO(log: SmsLogDO): SmsLogResDTO {
    const resp = new SmsLogResDTO();
    resp.id = log.id;
    resp.channelId = log.channelId;
    resp.channelCode = log.channelCode;
    resp.templateId = log.templateId;
    resp.templateCode = log.templateCode;
    resp.templateType = log.templateType;
    resp.templateContent = log.templateContent;
    resp.templateParams = log.templateParams ?? {};
    resp.apiTemplateId = log.apiTemplateId ?? undefined;
    resp.mobile = log.mobile;
    resp.userId = log.userId ?? undefined;
    resp.userType = log.userType ?? undefined;
    resp.sendStatus = log.sendStatus;
    resp.sendTime = formatDate(log.sendTime ?? undefined);
    resp.apiSendCode = log.apiSendCode ?? undefined;
    resp.apiSendMsg = log.apiSendMsg ?? undefined;
    resp.apiRequestId = log.apiRequestId ?? undefined;
    resp.apiSerialNo = log.apiSerialNo ?? undefined;
    // 接收状态数据库可空，ResDTO 必填：空值兜底 0（SmsReceiveStatusEnum.UNKNOWN）
    resp.receiveStatus = log.receiveStatus ?? 0;
    resp.receiveTime = formatDate(log.receiveTime ?? undefined);
    resp.apiReceiveCode = log.apiReceiveCode ?? undefined;
    resp.apiReceiveMsg = log.apiReceiveMsg ?? undefined;
    resp.createTime = formatDate(log.createTime);
    return resp;
  }
}
