import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ExportError, LoggerError } from '@/config/error-messages';
import { Prisma } from '@/generated/prisma/client';
import { LoginLogPageReqDTO, LoginLogResDTO } from './dto/loginLog.dto';
import { LoginLogRepository } from './repositories/loginLog.repository';
import { LoginLogDO } from './entities/loginLog.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { TenantCreateInput } from '@/common/tenant/tenant-write';

/**
 * 登录日志管理 Service
 *
 * 日志类模块仅提供「写 + 只读查询」能力，不提供 update/delete。
 */
@Injectable()
export class LoginLogService {
  constructor(private readonly loginLogRepository: LoginLogRepository) {}

  /**
   * 新增登录日志（供 AOP/拦截器在登录/登出后调用），返回插入行
   */
  async createLoginLog(
    data: TenantCreateInput<Prisma.SysLoginLogUncheckedCreateInput>,
  ): Promise<LoginLogDO> {
    return this.loginLogRepository.insert(data);
  }

  /**
   * 获取登录日志详情
   */
  async getLoginLog(id: number): Promise<LoginLogResDTO> {
    const log = await this.loginLogRepository.selectById(id);
    if (!log) {
      throw new HttpException(LoggerError.LOGIN_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(log);
  }

  /**
   * 分页查询登录日志
   */
  async getLoginLogPage(
    req: LoginLogPageReqDTO,
  ): Promise<PageResult<LoginLogResDTO>> {
    const where: Prisma.SysLoginLogWhereInput = {
      ...(req.userIp ? { userIp: { contains: req.userIp } } : {}),
      ...(req.username ? { username: { contains: req.username } } : {}),
      // 操作状态：true=登录成功(0)、false=登录失败(1)，映射 LoginResultEnum
      ...(req.status !== undefined ? { result: req.status ? 0 : 1 } : {}),
      // 登录时间范围 [开始时间, 结束时间]
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.loginLogRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return {
      list: list.map((log) => this.toResDTO(log)),
      total,
    };
  }

  /**
   * 导出登录日志 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.loginLogRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((log) => ({
      id: log.id,
      username: log.username,
      userIp: log.userIp,
      location: log.location ?? '',
      userAgent: log.userAgent ?? '',
      result: log.result === 0 ? '成功' : '失败',
      failReason: log.failReason ?? '',
      createTime: formatDate(log.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.LOGIN_LOG),
      filename: `${xl(ExportError.LOGIN_LOG)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.USERNAME), key: 'username', width: 18 },
        { header: xl(ExportError.USER_IP), key: 'userIp', width: 16 },
        { header: xl(ExportError.LOCATION), key: 'location', width: 24 },
        { header: xl(ExportError.USER_AGENT), key: 'userAgent', width: 36 },
        { header: xl(ExportError.LOGIN_RESULT), key: 'result', width: 10 },
        { header: xl(ExportError.LOGIN_FAIL_REASON), key: 'failReason', width: 28 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 登录日志 DO → ResDTO
   */
  private toResDTO(log: LoginLogDO): LoginLogResDTO {
    const resp = new LoginLogResDTO();
    resp.id = log.id;
    resp.logType = log.logType;
    resp.userId = log.userId ?? undefined;
    resp.userType = log.userType;
    resp.traceId = log.traceId ?? undefined;
    resp.username = log.username;
    resp.result = log.result;
    resp.userIp = log.userIp;
    resp.location = log.location ?? undefined;
    resp.userAgent = log.userAgent ?? undefined;
    resp.failReason = log.failReason ?? undefined;
    resp.createTime = formatDate(log.createTime);
    return resp;
  }
}
