import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  ErrorCodePageReqDTO,
  ErrorCodeResDTO,
  ErrorCodeSaveReqDTO,
} from './dto/errorCode.dto';
import { ErrorCodeRepository } from './repositories/errorCode.repository';
import { ErrorCodeDO } from './entities/errorCode.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, ErrorCodeError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

@Injectable()
export class ErrorCodeService {
  constructor(private readonly repo: ErrorCodeRepository) {}

  private currentTenantId(): string {
    return TenantContext.requireTenantId(DEFAULT_TENANT_ID);
  }

  async create(req: ErrorCodeSaveReqDTO): Promise<number> {
    const tenantId = this.currentTenantId();
    const exists = await this.repo.selectByUnique({
      applicationName: req.applicationName,
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        ErrorCodeError.CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.repo.insert({
      tenantId,
      type: req.type ?? 2,
      applicationName: req.applicationName,
      code: req.code,
      message: req.message,
      memo: req.memo ?? null,
    });
  }

  async update(req: ErrorCodeSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const existing = await this.repo.selectById(req.id);
    if (!existing) {
      throw new HttpException(
        ErrorCodeError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const dup = await this.repo.selectByUnique({
      applicationName: req.applicationName,
      code: req.code,
      NOT: { id: req.id },
    });
    if (dup) {
      throw new HttpException(
        ErrorCodeError.CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.repo.updateById(req.id, {
      type: req.type ?? 2,
      applicationName: req.applicationName,
      code: req.code,
      message: req.message,
      memo: req.memo ?? null,
    });
  }

  async delete(id: number): Promise<boolean> {
    const existing = await this.repo.selectById(id);
    if (!existing) {
      throw new HttpException(
        ErrorCodeError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.repo.deleteById(id);
  }

  async deleteList(ids: number[]): Promise<boolean> {
    return this.repo.deleteBatchIds(ids);
  }

  async get(id: number): Promise<ErrorCodeResDTO> {
    const row = await this.repo.selectById(id);
    if (!row) {
      throw new HttpException(
        ErrorCodeError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResp(row);
  }

  async page(query: ErrorCodePageReqDTO): Promise<PageResult<ErrorCodeResDTO>> {
    const where: Prisma.SysErrorCodeWhereInput = {
    };
    if (query.code !== undefined && query.code !== null) where.code = query.code;
    if (query.applicationName) {
      where.applicationName = { contains: query.applicationName };
    }
    if (query.message) where.message = { contains: query.message };
    const { list, total } = await this.repo.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((r) => this.toResp(r)), total };
  }

  /** 按 code 取运营文案（供过滤器覆盖默认文案；无租户时用 0） */
  async getMessageByCode(
    code: number,
    applicationName = process.env.APPLICATION_NAME || 'moyu-system-server',
  ): Promise<string | null> {
    const row = await this.repo.selectByUnique({
      applicationName,
      code,
    });
    return row?.message ?? null;
  }

  private toResp(row: ErrorCodeDO): ErrorCodeResDTO {
    return {
      id: row.id,
      type: row.type,
      applicationName: row.applicationName,
      code: row.code,
      message: row.message,
      memo: row.memo ?? undefined,
      createTime: formatDate(row.createTime),
    };
  }
}
