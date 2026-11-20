import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  ApiErrorLogPageReqDTO,
  ApiErrorLogProcessReqDTO,
  ApiErrorLogResDTO,
} from './dto/apiErrorLog.dto';
import { ApiErrorLogRepository } from './repositories/apiErrorLog.repository';
import { ApiErrorLogDO } from '../apiAccessLog/entities/apiAccessLog.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { ApiLogError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

@Injectable()
export class ApiErrorLogService {
  constructor(private readonly repo: ApiErrorLogRepository) {}

  async createQuiet(
    data: Omit<Prisma.SysApiErrorLogUncheckedCreateInput, 'id' | 'createTime'>,
  ): Promise<void> {
    try {
      await this.repo.insert(data);
    } catch {
      // ignore
    }
  }

  async get(id: number): Promise<ApiErrorLogResDTO> {
    const row = await this.repo.selectById(id);
    if (!row) {
      throw new HttpException(
        ApiLogError.ERROR_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResp(row);
  }

  async page(
    query: ApiErrorLogPageReqDTO,
  ): Promise<PageResult<ApiErrorLogResDTO>> {
    const where: Prisma.SysApiErrorLogWhereInput = {
    };
    if (query.requestUrl) where.requestUrl = { contains: query.requestUrl };
    if (query.processStatus !== undefined && query.processStatus !== null) {
      where.processStatus = query.processStatus;
    }
    if (query.exceptionName) {
      where.exceptionName = { contains: query.exceptionName };
    }
    const { list, total } = await this.repo.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((r) => this.toResp(r)), total };
  }

  async process(
    req: ApiErrorLogProcessReqDTO,
    userId: number,
  ): Promise<boolean> {
    if (req.processStatus !== 1 && req.processStatus !== 2) {
      throw new HttpException(ApiLogError.PROCESS_STATUS_INVALID, HttpStatus.BAD_REQUEST);
    }
    const row = await this.repo.selectById(req.id);
    if (!row) {
      throw new HttpException(
        ApiLogError.ERROR_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.repo.updateById(req.id, {
      processStatus: req.processStatus,
      processTime: new Date(),
      processUserId: userId,
    });
  }

  private toResp(row: ApiErrorLogDO): ApiErrorLogResDTO {
    return {
      id: row.id,
      traceId: row.traceId ?? undefined,
      userId: row.userId,
      applicationName: row.applicationName,
      requestMethod: row.requestMethod,
      requestUrl: row.requestUrl,
      requestParams: row.requestParams ?? undefined,
      userIp: row.userIp ?? undefined,
      exceptionTime: formatDate(row.exceptionTime),
      exceptionName: row.exceptionName,
      exceptionMessage: row.exceptionMessage ?? undefined,
      exceptionStackTrace: row.exceptionStackTrace ?? undefined,
      processStatus: row.processStatus,
      processTime: row.processTime ? formatDate(row.processTime) : undefined,
      createTime: formatDate(row.createTime),
    };
  }
}
