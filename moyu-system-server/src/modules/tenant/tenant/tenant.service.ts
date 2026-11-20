import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  TenantPageReqDTO,
  TenantResDTO,
  TenantSaveReqDTO,
  TenantPublicResDTO,
} from './dto/tenant.dto';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantDO } from './entities/tenant.entity';
import { UserRepository } from '@/modules/user/user/repositories/user.repository';
import { UserProfileRepository } from '@/modules/user/userProfile/repositories/userProfile.repository';
import { RoleRepository } from '@/modules/permission/role/repositories/role.repository';
import { RoleMenuRepository } from '@/modules/permission/role/repositories/roleMenu.repository';
import { UserRoleRepository } from '@/modules/permission/role/repositories/userRole.repository';
import { TenantPackageService } from '../tenantPackage/tenantPackage.service';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { CommonError, ExportError, TenantError } from '@/config/error-messages';
import { hashPassword } from '@/utils/password';
import { TenantContext } from '@/common/tenant/tenant.context';
import { TENANT_ADMIN_ROLE_CODE } from '@/config/constants';
import { TenantPolicyService } from '../policy/tenant-policy.service';

/**
 * 租户管理 Service
 */
@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly tenantPackageService: TenantPackageService,
    private readonly tenantPolicyService: TenantPolicyService,
  ) {}

  /**
   * 使用租户名，获得租户编号（登录界面使用）
   * 对齐 yudao：不存在时返回 null，不抛 404
   */
  async getTenantIdByName(name: string): Promise<number | null> {
    const tenant = await this.tenantRepository.selectByUnique({ name });
    return tenant?.id ?? null;
  }

  /**
   * 获取租户精简信息列表（仅启用，用于【首页】选择租户）
   */
  async getTenantSimpleList(): Promise<TenantPublicResDTO[]> {
    const list = await this.tenantRepository.selectList({ status: 1 });
    return list.map((tenant) => this.toPublicResDTO(tenant));
  }

  /**
   * 使用域名，获得租户信息（登录界面使用）
   * 对齐 yudao TenantController#getTenantByWebsite：未匹配或已禁用返回 null
   */
  async getTenantByWebsite(
    website: string,
  ): Promise<TenantPublicResDTO | null> {
    const host = this.normalizeWebsite(website);
    if (!host) {
      return null;
    }
    // 不按 status 预过滤：与 yudao selectListByWebsite + 再判禁用一致
    const list = await this.tenantRepository.selectList();
    const matched = list.find((tenant) => {
      const sites = this.parseWebsites(tenant.websites);
      return sites.some((site) => this.websiteMatches(site, host));
    });
    if (!matched || matched.status !== 1) {
      return null;
    }
    return this.toPublicResDTO(matched);
  }

  /**
   * 创建租户（同一租户上下文内创建管理员用户 + 租户管理员角色 + 套餐菜单）
   */
  async createTenant(req: TenantSaveReqDTO): Promise<number> {
    const exists = await this.tenantRepository.selectByUnique({
      name: req.name,
    });
    if (exists) {
      throw new HttpException(
        TenantError.EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!req.username?.trim() || !req.password) {
      throw new HttpException(
        TenantError.ADMIN_CREDENTIALS_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const pkg = await this.tenantPackageService.getTenantPackage(req.packageId);
    const tenantId = await this.tenantRepository.insert({
      name: req.name,
      contactUserId: null,
      contactName: req.contactName,
      contactMobile: req.contactMobile ?? null,
      status: req.status,
      websites: req.websites ?? [],
      packageId: req.packageId,
      expireTime: new Date(req.expireTime),
      accountCount: req.accountCount,
    });

    const tenantIdStr = String(tenantId);
    return TenantContext.run(
      { tenantId: tenantIdStr, ignore: false },
      async () => {
        // 租户管理员角色
        const roleId = await this.roleRepository.insert({
          tenantId: tenantIdStr,
          name: '租户管理员',
          code: TENANT_ADMIN_ROLE_CODE,
          sort: 0,
          status: 1,
          type: 1,
          remark: '租户创建时自动生成',
          dataScope: 1,
          dataScopeDeptIds: [],
        });
        const menuIds = Array.isArray(pkg.menuIds) ? pkg.menuIds : [];
        if (menuIds.length > 0) {
          await this.roleMenuRepository.replaceRoleMenus(
            roleId,
            tenantIdStr,
            menuIds,
          );
        }

        // 管理员用户
        const userId = await this.userRepository.insert({
          tenantId: tenantIdStr,
          username: req.username.trim(),
          password: await hashPassword(req.password),
          status: 1,
          postIds: [],
          passwordUpdateTime: new Date(),
        });
        await this.userProfileRepository.upsertByUserId(userId, {
          tenantId: tenantIdStr,
          nickname: req.contactName || req.username,
          mobile: req.contactMobile ?? null,
        });
        await this.userRoleRepository.replaceUserRoles(userId, [roleId]);
        await this.tenantRepository.updateById(tenantId, {
          contactUserId: userId,
        });
        return tenantId;
      },
    );
  }

  /**
   * 更新租户
   */
  async updateTenant(req: TenantSaveReqDTO): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const conflict = await this.tenantRepository.selectByUnique({
      name: req.name,
      id: { not: id },
    });
    if (conflict) {
      throw new HttpException(
        TenantError.EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    const packageChanged = tenant.packageId !== req.packageId;
    const ok = await this.tenantRepository.updateById(id, {
      name: req.name,
      contactName: req.contactName,
      contactMobile: req.contactMobile ?? tenant.contactMobile,
      status: req.status,
      websites: req.websites ?? [],
      packageId: req.packageId,
      expireTime: new Date(req.expireTime),
      accountCount: req.accountCount,
    });
    if (ok && packageChanged) {
      const pkg = await this.tenantPackageService.getTenantPackage(
        req.packageId,
      );
      await this.tenantPolicyService.syncTenantAdminMenus(
        String(id),
        Array.isArray(pkg.menuIds) ? pkg.menuIds : [],
      );
    }
    return ok;
  }

  /**
   * 删除租户
   */
  async deleteTenant(id: number): Promise<boolean> {
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.tenantRepository.deleteById(id);
  }

  /**
   * 批量删除租户
   */
  async deleteTenantList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.tenantRepository.deleteBatchIds(ids);
  }

  /**
   * 获取租户详情
   */
  async getTenant(id: number): Promise<TenantResDTO> {
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant) {
      throw new HttpException(
        TenantError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(tenant);
  }

  /**
   * 获取租户分页列表
   */
  async getTenantPage(
    query: TenantPageReqDTO,
  ): Promise<PageResult<TenantResDTO>> {
    const where = {
      ...(query.name ? { name: { contains: query.name } } : {}),
      ...(query.contactName
        ? { contactName: { contains: query.contactName } }
        : {}),
      ...(query.contactMobile
        ? { contactMobile: { contains: query.contactMobile } }
        : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.createTime && query.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(query.createTime[0]),
              lte: new Date(query.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.tenantRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((tenant) => this.toResDTO(tenant)), total };
  }

  /**
   * 导出租户 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.tenantRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      contactName: tenant.contactName ?? '',
      contactMobile: tenant.contactMobile ?? '',
      status: tenant.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      expireTime: formatDate(tenant.expireTime),
      createTime: formatDate(tenant.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.TENANT),
      filename: `${xl(ExportError.TENANT)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.NAME), key: 'name', width: 18 },
        { header: xl(ExportError.CONTACT_NAME), key: 'contactName', width: 14 },
        { header: xl(ExportError.CONTACT_MOBILE), key: 'contactMobile', width: 16 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.EXPIRE_TIME), key: 'expireTime', width: 20 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 解析 websites 字段：兼容 JSON 数组、JSON 字符串、yudao 逗号分隔串
   */
  private parseWebsites(raw: unknown): string[] {
    if (raw == null) return [];
    if (Array.isArray(raw)) {
      return raw.map((x) => String(x)).filter(Boolean);
    }
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return [];
      if (s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            return parsed.map((x) => String(x)).filter(Boolean);
          }
        } catch {
          /* fall through */
        }
      }
      return s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [];
  }

  /** 归一化域名：去协议、路径，转小写；保留 host[:port] */
  private normalizeWebsite(input: string): string {
    let s = (input || '').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/^https?:\/\//, '');
    s = s.split('/')[0] || '';
    return s;
  }

  /** 仅 host（去掉端口），便于 localhost:5173 匹配库中的 localhost */
  private websiteHost(normalized: string): string {
    return (normalized.split(':')[0] || '').trim();
  }

  private websiteMatches(stored: string, requested: string): boolean {
    const a = this.normalizeWebsite(stored);
    const b = this.normalizeWebsite(requested);
    if (!a || !b) return false;
    if (a === b) return true;
    return this.websiteHost(a) === this.websiteHost(b);
  }

  private toPublicResDTO(tenant: TenantDO): TenantPublicResDTO {
    const resp = new TenantPublicResDTO();
    resp.id = tenant.id;
    resp.name = tenant.name;
    return resp;
  }

  private toResDTO(tenant: TenantDO): TenantResDTO {
    const resp = new TenantResDTO();
    resp.id = tenant.id;
    resp.name = tenant.name;
    resp.contactName = tenant.contactName ?? '';
    resp.contactMobile = tenant.contactMobile ?? undefined;
    resp.status = tenant.status;
    resp.websites = this.parseWebsites(tenant.websites);
    resp.packageId = tenant.packageId;
    resp.expireTime = formatDate(tenant.expireTime);
    resp.accountCount = tenant.accountCount;
    resp.createTime = formatDate(tenant.createTime);
    return resp;
  }
}
