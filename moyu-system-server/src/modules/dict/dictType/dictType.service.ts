import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DictError, ExportError } from '@/config/error-messages';
import {
  DictTypePageReqDTO,
  DictTypeResDTO,
  DictTypeSaveReqDTO,
  DictTypeSimpleResDTO,
} from './dto/dictType.dto';
import { DictTypeRepository } from './repositories/dictType.repository';
import { DictTypeDO } from './entities/dictType.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';

/**
 * 字典类型管理 Service
 */
@Injectable()
export class DictTypeService {
  constructor(private readonly dictTypeRepository: DictTypeRepository) {}

  /**
   * 创建字典类型
   */
  async createDictType(req: DictTypeSaveReqDTO): Promise<number> {
    // 字典类型 type 不允许重复
    const exists = await this.dictTypeRepository.selectByUnique({
      type: req.type,
    });
    if (exists) {
      throw new HttpException(DictError.TYPE_EXISTS, HttpStatus.BAD_REQUEST);
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.dictTypeRepository.insert({
      name: req.name,
      type: req.type,
      status: req.status,
      remark: req.remark ?? null,
    });
  }

  /**
   * 修改字典类型
   */
  async updateDictType(req: DictTypeSaveReqDTO): Promise<boolean> {
    // 存在性校验
    if (req.id === undefined) {
      throw new HttpException(DictError.TYPE_ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const dictType = await this.dictTypeRepository.selectById(req.id);
    if (!dictType) {
      throw new HttpException(DictError.TYPE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    // 字典类型 type 唯一（排除自身）
    const conflict = await this.dictTypeRepository.selectByUnique({
      type: req.type,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(DictError.TYPE_EXISTS, HttpStatus.BAD_REQUEST);
    }
    return this.dictTypeRepository.updateById(req.id, {
      name: req.name,
      type: req.type,
      status: req.status,
      remark: req.remark ?? dictType.remark,
    });
  }

  /**
   * 删除字典类型
   */
  async deleteDictType(id: number): Promise<boolean> {
    const dictType = await this.dictTypeRepository.selectById(id);
    if (!dictType) {
      throw new HttpException(DictError.TYPE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.dictTypeRepository.deleteById(id);
  }

  /**
   * 批量删除字典类型
   */
  async deleteDictTypeList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.dictTypeRepository.deleteBatchIds(ids);
  }

  /**
   * 获取字典类型分页列表
   */
  async pageDictTypes(
    req: DictTypePageReqDTO,
  ): Promise<PageResult<DictTypeResDTO>> {
    const { list, total } = await this.dictTypeRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      {
        ...(req.name ? { name: { contains: req.name } } : {}),
        ...(req.type ? { type: { contains: req.type } } : {}),
        ...(req.status !== undefined ? { status: req.status } : {}),
      },
      { updateTime: 'desc' },
    );
    return {
      list: list.map((dictType) => this.toResDTO(dictType)),
      total,
    };
  }

  /**
   * 获取字典类型详情
   */
  async getDictType(id: number): Promise<DictTypeResDTO> {
    const dictType = await this.dictTypeRepository.selectById(id);
    if (!dictType) {
      throw new HttpException(DictError.TYPE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(dictType);
  }

  /**
   * 获取字典类型精简列表（id/name/type，用于前端下拉选项）
   */
  async getSimpleDictTypeList(): Promise<DictTypeSimpleResDTO[]> {
    const list = await this.dictTypeRepository.selectList();
    return list.map((dictType) => {
      const resp = new DictTypeSimpleResDTO();
      resp.id = dictType.id;
      resp.name = dictType.name;
      resp.type = dictType.type;
      return resp;
    });
  }

  /**
   * 导出字典类型 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.dictTypeRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((dictType) => ({
      id: dictType.id,
      name: dictType.name,
      type: dictType.type,
      status: dictType.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      remark: dictType.remark ?? '',
      createTime: formatDate(dictType.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.DICT_TYPE),
      filename: `${xl(ExportError.DICT_TYPE)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.NAME), key: 'name', width: 18 },
        { header: xl(ExportError.TYPE), key: 'type', width: 18 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.REMARK), key: 'remark', width: 24 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 字典类型 DO → ResDTO
   */
  private toResDTO(dictType: DictTypeDO): DictTypeResDTO {
    const resp = new DictTypeResDTO();
    resp.id = dictType.id;
    resp.name = dictType.name;
    resp.type = dictType.type;
    resp.status = dictType.status;
    resp.remark = dictType.remark ?? undefined;
    resp.createTime = formatDate(dictType.createTime);
    return resp;
  }
}
