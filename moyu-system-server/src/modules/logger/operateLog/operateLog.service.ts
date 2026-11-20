import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ExportError, LoggerError } from '@/config/error-messages';
import { OperateLogPageReqDTO, OperateLogResDTO } from './dto/operateLog.dto';
import { OperateLogRepository } from './repositories/operateLog.repository';
import { OperateLogDO } from './entities/operateLog.entity';
import { Prisma } from '@/generated/prisma/client';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { TenantCreateInput } from '@/common/tenant/tenant-write';

/**
 * 操作日志管理 Service
 */
@Injectable()
export class OperateLogService {
  constructor(private readonly operateLogRepository: OperateLogRepository) {}

  /**
   * 创建操作日志（供 AOP/拦截器记录操作日志时调用）
   *
   * 注意：操作日志为写后即弃的审计数据，不提供 update/delete。
   */
  async createOperateLog(
    data: TenantCreateInput<Prisma.SysOperateLogUncheckedCreateInput>,
  ): Promise<OperateLogDO> {
    return this.operateLogRepository.insert(data);
  }

  /**
   * 获取操作日志详情
   */
  async getOperateLog(id: number): Promise<OperateLogResDTO> {
    const log = await this.operateLogRepository.selectById(id);
    if (!log) {
      throw new HttpException(LoggerError.OPERATE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(log);
  }

  /**
   * 分页查询操作日志
   */
  async pageOperateLog(
    req: OperateLogPageReqDTO,
  ): Promise<PageResult<OperateLogResDTO>> {
    const { list, total } = await this.operateLogRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.userId !== undefined ? { userId: req.userId } : {}),
        ...(req.bizId !== undefined ? { bizId: req.bizId } : {}),
        ...(req.type ? { type: { contains: req.type } } : {}),
        ...(req.subType ? { subType: { contains: req.subType } } : {}),
        ...(req.action ? { action: { contains: req.action } } : {}),
        ...(req.createTime && req.createTime.length === 2
          ? {
              createTime: {
                gte: new Date(req.createTime[0].replace(' ', 'T')),
                lte: new Date(req.createTime[1].replace(' ', 'T')),
              },
            }
          : {}),
      },
    );
    return {
      list: list.map((log) => this.toResDTO(log)),
      total,
    };
  }

  /**
   * 导出操作日志 Excel（最多 EXCEL_MAX_ROWS 行）
   * 实体无 module/name/result：用 type/subType/action 对应
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.operateLogRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((log) => ({
      id: log.id,
      userId: log.userId,
      type: xl(log.type),
      subType: xl(log.subType),
      action: log.action ?? '',
      createTime: formatDate(log.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.OPERATE_LOG),
      filename: `${xl(ExportError.OPERATE_LOG)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.USER_ID), key: 'userId', width: 12 },
        { header: xl(ExportError.OPERATE_MODULE), key: 'type', width: 16 },
        { header: xl(ExportError.OPERATE_NAME), key: 'subType', width: 16 },
        { header: xl(ExportError.OPERATE_CONTENT), key: 'action', width: 36 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 操作日志 DO → ResDTO
   */
  private toResDTO(log: OperateLogDO): OperateLogResDTO {
    const resp = new OperateLogResDTO();
    resp.id = log.id;
    resp.traceId = log.traceId;
    resp.userId = log.userId;
    // 注意：ResDTO.userName 对应展示侧联表字段，SysOperateLog 表并未冗余存储，
    // 此处不臆造填充，由前端展示层结合用户信息处理
    resp.userType = log.userType;
    resp.type = xl(log.type);
    resp.subType = xl(log.subType);
    // bizId 数据库类型为 BigInt，ResDTO 为 number：经 String 中转序列化（bizId 可空，兜底 0）
    resp.bizId = log.bizId !== null && log.bizId !== undefined ? Number(String(log.bizId)) : 0;
    resp.action = log.action ?? undefined;
    resp.extra = log.extra ?? undefined;
    resp.requestMethod = log.requestMethod;
    resp.requestUrl = log.requestUrl;
    resp.userIp = log.userIp;
    resp.userAgent = log.userAgent;
    resp.createTime = formatDate(log.createTime);
    return resp;
  }
}
