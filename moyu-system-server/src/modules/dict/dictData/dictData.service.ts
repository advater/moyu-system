import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DictError, ExportError } from '@/config/error-messages';
import {
  DictDataPageReqDTO,
  DictDataResDTO,
  DictDataSaveReqDTO,
  DictDataSimpleResDTO,
} from './dto/dictData.dto';
import { DictDataRepository } from './repositories/dictData.repository';
import { DictDataDO } from './entities/dictData.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { RedisService } from '@/plugins/redis/redis.service';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

const DICT_CACHE_TTL_MS = 10 * 60_000;

/**
 * 字典数据管理 Service
 */
@Injectable()
export class DictDataService {
  constructor(
    private readonly dictDataRepository: DictDataRepository,
    private readonly redisService: RedisService,
  ) {}

  private cacheKey(dictType: string): string {
    const tenantId = TenantContext.getTenantId() || DEFAULT_TENANT_ID;
    return `sys:dict:${tenantId}:${dictType}`;
  }

  private async invalidateByType(dictType: string): Promise<void> {
    await this.redisService.delete(this.cacheKey(dictType));
  }

  /**
   * 新增字典数据
   */
  async createDictData(req: DictDataSaveReqDTO): Promise<number> {
    // 同一字典类型下，字典值不允许重复（表无唯一键，复合校验兜底）
    const exists = await this.dictDataRepository.selectByDictTypeAndValue(
      req.dictType,
      req.value,
    );
    if (exists) {
      throw new HttpException(DictError.DATA_EXISTS, HttpStatus.BAD_REQUEST);
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.dictDataRepository.insert({
      sort: req.sort,
      label: req.label,
      value: req.value,
      dictType: req.dictType,
      status: req.status,
      colorType: req.colorType ?? null,
      cssClass: req.cssClass ?? null,
      remark: req.remark ?? null,
    }).then(async (id) => {
      await this.invalidateByType(req.dictType);
      return id;
    });
  }

  /**
   * 修改字典数据
   */
  async updateDictData(req: DictDataSaveReqDTO): Promise<boolean> {
    // 存在性校验
    if (req.id === undefined) {
      throw new HttpException(DictError.DATA_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const dictData = await this.dictDataRepository.selectById(req.id);
    if (!dictData) {
      throw new HttpException(DictError.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    // 同一字典类型下，字典值唯一（排除自身）
    const conflict = await this.dictDataRepository.selectByDictTypeAndValue(
      req.dictType,
      req.value,
      req.id,
    );
    if (conflict) {
      throw new HttpException(DictError.DATA_EXISTS, HttpStatus.BAD_REQUEST);
    }
    const ok = await this.dictDataRepository.updateById(req.id, {
      sort: req.sort,
      label: req.label,
      value: req.value,
      dictType: req.dictType,
      status: req.status,
      colorType: req.colorType ?? dictData.colorType ?? null,
      cssClass: req.cssClass ?? dictData.cssClass ?? null,
      remark: req.remark ?? dictData.remark ?? null,
    });
    await this.invalidateByType(dictData.dictType);
    if (req.dictType !== dictData.dictType) {
      await this.invalidateByType(req.dictType);
    }
    return ok;
  }

  /**
   * 删除字典数据
   */
  async deleteDictData(id: number): Promise<boolean> {
    const dictData = await this.dictDataRepository.selectById(id);
    if (!dictData) {
      throw new HttpException(DictError.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const ok = await this.dictDataRepository.deleteById(id);
    await this.invalidateByType(dictData.dictType);
    return ok;
  }

  /**
   * 批量删除字典数据
   */
  async deleteDictDataList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    for (const id of ids) {
      await this.deleteDictData(id);
    }
    return true;
  }

  /**
   * 获取字典数据精简列表（仅启用）
   */
  async getSimpleDictDataList(): Promise<DictDataSimpleResDTO[]> {
    const list = await this.dictDataRepository.selectSimpleList({ status: 1 });
    return list.map((item) => this.toSimple(item));
  }

  /**
   * 按 dictType 批量拉取（Redis 短缓存，默认启用项）
   */
  async getDictDataListByTypes(
    dictTypes: string[],
  ): Promise<Record<string, DictDataSimpleResDTO[]>> {
    const types = [...new Set((dictTypes ?? []).map((t) => t.trim()).filter(Boolean))];
    const result: Record<string, DictDataSimpleResDTO[]> = {};
    for (const dictType of types) {
      const key = this.cacheKey(dictType);
      const cached = await this.redisService.get<DictDataSimpleResDTO[]>(key);
      if (cached) {
        result[dictType] = cached;
        continue;
      }
      const list = await this.dictDataRepository.selectSimpleList({
        dictType,
        status: 1,
      });
      const mapped = list.map((item) => this.toSimple(item));
      await this.redisService.set(key, mapped, DICT_CACHE_TTL_MS);
      result[dictType] = mapped;
    }
    return result;
  }

  private toSimple(item: {
    dictType: string;
    value: string;
    label: string;
    colorType?: string | null;
    cssClass?: string | null;
  }): DictDataSimpleResDTO {
    const resp = new DictDataSimpleResDTO();
    resp.dictType = item.dictType;
    resp.value = item.value;
    resp.label = item.label;
    resp.colorType = item.colorType ?? '';
    resp.cssClass = item.cssClass ?? '';
    return resp;
  }

  /**
   * 获取字典数据分页列表
   */
  async getDictTypePage(
    req: DictDataPageReqDTO,
  ): Promise<PageResult<DictDataResDTO>> {
    const { list, total } = await this.dictDataRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.label ? { label: { contains: req.label } } : {}),
        ...(req.dictType ? { dictType: { contains: req.dictType } } : {}),
        ...(req.status !== undefined ? { status: req.status } : {}),
      },
    );
    return {
      list: list.map((item) => this.toResDTO(item)),
      total,
    };
  }

  /**
   * 获取字典数据详情
   */
  async getDictData(id: number): Promise<DictDataResDTO> {
    const dictData = await this.dictDataRepository.selectById(id);
    if (!dictData) {
      throw new HttpException(DictError.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(dictData);
  }

  /**
   * 导出字典数据 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.dictDataRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((item) => ({
      id: item.id,
      sort: item.sort,
      label: item.label,
      value: item.value,
      dictType: item.dictType,
      status: item.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      remark: item.remark ?? '',
      createTime: formatDate(item.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.DICT_DATA),
      filename: `${xl(ExportError.DICT_DATA)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.SORT), key: 'sort', width: 10 },
        { header: xl(ExportError.LABEL), key: 'label', width: 18 },
        { header: xl(ExportError.VALUE), key: 'value', width: 18 },
        { header: xl(ExportError.DICT_TYPE), key: 'dictType', width: 18 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.REMARK), key: 'remark', width: 24 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 字典数据 DO → ResDTO
   */
  private toResDTO(dictData: DictDataDO): DictDataResDTO {
    const resp = new DictDataResDTO();
    resp.id = dictData.id;
    resp.sort = dictData.sort;
    resp.label = dictData.label;
    resp.value = dictData.value;
    resp.dictType = dictData.dictType;
    resp.status = dictData.status;
    resp.colorType = dictData.colorType ?? '';
    resp.cssClass = dictData.cssClass ?? '';
    resp.remark = dictData.remark ?? '';
    resp.createTime = formatDate(dictData.createTime);
    return resp;
  }
}
