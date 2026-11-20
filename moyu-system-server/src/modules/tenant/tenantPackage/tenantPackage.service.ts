import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  TenantPackagePageReqDTO,
  TenantPackageResDTO,
  TenantPackageSaveReqDTO,
  TenantPackageSimpleResDTO,
} from './dto/tenantPackage.dto';
import { TenantPackageRepository } from './repositories/tenantPackage.repository';
import { TenantPackageDO } from './entities/tenantPackage.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, TenantError } from '@/config/error-messages';
import { TenantPolicyService } from '../policy/tenant-policy.service';

/**
 * 租户套餐管理 Service
 */
@Injectable()
export class TenantPackageService {
  constructor(
    private readonly tenantPackageRepository: TenantPackageRepository,
    private readonly tenantPolicyService: TenantPolicyService,
  ) {}

  /**
   * 创建租户套餐
   */
  async createTenantPackage(req: TenantPackageSaveReqDTO): Promise<number> {
    // 套餐名不允许重复
    const exists = await this.tenantPackageRepository.selectByUnique({
      name: req.name,
    });
    if (exists) {
      throw new HttpException(
        TenantError.EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.tenantPackageRepository.insert({
      name: req.name,
      status: req.status,
      remark: req.remark ?? null,
      menuIds: req.menuIds,
      features: req.features ?? undefined,
    });
  }

  /**
   * 更新租户套餐
   */
  async updateTenantPackage(req: TenantPackageSaveReqDTO): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const tenantPackage = await this.tenantPackageRepository.selectById(id);
    if (!tenantPackage) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // 套餐名唯一（排除自身）
    const conflict = await this.tenantPackageRepository.selectByUnique({
      name: req.name,
      id: { not: id },
    });
    if (conflict) {
      throw new HttpException(
        TenantError.EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ok = await this.tenantPackageRepository.updateById(id, {
      name: req.name,
      status: req.status,
      remark: req.remark ?? tenantPackage.remark,
      menuIds: req.menuIds,
      ...(req.features !== undefined
        ? { features: req.features }
        : {}),
    });
    if (ok) {
      await this.tenantPolicyService.syncPackageMenusToTenants(
        id,
        Array.isArray(req.menuIds) ? req.menuIds : [],
      );
    }
    return ok;
  }

  /**
   * 删除租户套餐
   */
  async deleteTenantPackage(id: number): Promise<boolean> {
    const tenantPackage = await this.tenantPackageRepository.selectById(id);
    if (!tenantPackage) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.tenantPackageRepository.deleteById(id);
  }

  /**
   * 批量删除租户套餐
   */
  async deleteTenantPackageList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.tenantPackageRepository.deleteBatchIds(ids);
  }

  /**
   * 获取租户套餐详情
   */
  async getTenantPackage(id: number): Promise<TenantPackageResDTO> {
    const tenantPackage = await this.tenantPackageRepository.selectById(id);
    if (!tenantPackage) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(tenantPackage);
  }

  /**
   * 获取租户套餐分页列表
   */
  async getTenantPackagePage(
    query: TenantPackagePageReqDTO,
  ): Promise<PageResult<TenantPackageResDTO>> {
    const where = {
      ...(query.name ? { name: { contains: query.name } } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.remark ? { remark: { contains: query.remark } } : {}),
      ...(query.createTime && query.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(query.createTime[0]),
              lte: new Date(query.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.tenantPackageRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((item) => this.toResDTO(item)), total };
  }

  /**
   * 获取租户套餐精简列表（仅启用）
   */
  async getSimpleTenantPackageList(): Promise<TenantPackageSimpleResDTO[]> {
    const list = await this.tenantPackageRepository.selectList({ status: 1 });
    return list.map((item) => {
      const resp = new TenantPackageSimpleResDTO();
      resp.id = item.id;
      resp.name = item.name;
      return resp;
    });
  }

  /** 菜单变更影响范围：包含该 menuId 的套餐列表 */
  async listPackagesByMenuId(
    menuId: number,
  ): Promise<TenantPackageSimpleResDTO[]> {
    const list = await this.tenantPackageRepository.selectList({});
    return list
      .filter((item) => {
        const ids = Array.isArray(item.menuIds) ? item.menuIds.map(Number) : [];
        return ids.includes(Number(menuId));
      })
      .map((item) => {
        const resp = new TenantPackageSimpleResDTO();
        resp.id = item.id;
        resp.name = item.name;
        return resp;
      });
  }

  /**
   * 租户套餐 DO → ResDTO
   */
  private toResDTO(item: TenantPackageDO): TenantPackageResDTO {
    const resp = new TenantPackageResDTO();
    resp.id = item.id;
    resp.name = item.name;
    resp.status = item.status;
    resp.remark = item.remark ?? undefined;
    resp.menuIds = item.menuIds ?? [];
    resp.features =
      item.features && typeof item.features === 'object'
        ? (item.features)
        : undefined;
    resp.createTime = formatDate(item.createTime);
    return resp;
  }
}
