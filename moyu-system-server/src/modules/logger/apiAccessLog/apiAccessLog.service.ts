import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  ApiAccessLogPageReqDTO,
  ApiAccessLogResDTO,
} from './dto/apiAccessLog.dto';
import { ApiAccessLogRepository } from './repositories/apiAccessLog.repository';
import { ApiAccessLogDO } from './entities/apiAccessLog.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { ApiLogError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

@Injectable()
export class ApiAccessLogService {
  constructor(private readonly repo: ApiAccessLogRepository) {}

  async createQuiet(
    data: Omit<
      Prisma.SysApiAccessLogUncheckedCreateInput,
      'id' | 'createTime'
    >,
  ): Promise<void> {
    try {
      await this.repo.insert(data);
    } catch {
      // 访问日志失败不影响主请求
    }
  }

  async get(id: number): Promise<ApiAccessLogResDTO> {
    const row = await this.repo.selectById(id);
    if (!row) {
      throw new HttpException(
        ApiLogError.ACCESS_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResp(row);
  }

  async page(
    query: ApiAccessLogPageReqDTO,
  ): Promise<PageResult<ApiAccessLogResDTO>> {
    const where: Prisma.SysApiAccessLogWhereInput = {
    };
    if (query.requestUrl) where.requestUrl = { contains: query.requestUrl };
    if (query.userId !== undefined && query.userId !== null) {
      where.userId = query.userId;
    }
    if (query.applicationName) {
      where.applicationName = query.applicationName;
    }
    const { list, total } = await this.repo.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((r) => this.toResp(r)), total };
  }

  private toResp(row: ApiAccessLogDO): ApiAccessLogResDTO {
    return {
      id: row.id,
      traceId: row.traceId ?? undefined,
      userId: row.userId,
      userType: row.userType,
      applicationName: row.applicationName,
      requestMethod: row.requestMethod,
      requestUrl: row.requestUrl,
      requestParams: row.requestParams ?? undefined,
      userIp: row.userIp ?? undefined,
      userAgent: row.userAgent ?? undefined,
      beginTime: formatDate(row.beginTime),
      endTime: formatDate(row.endTime),
      duration: row.duration,
      resultCode: row.resultCode,
      resultMsg: row.resultMsg ?? undefined,
      createTime: formatDate(row.createTime),
    };
  }
}
