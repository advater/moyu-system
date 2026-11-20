import { xl } from '@/i18n/xl';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  RolePageReqDTO,
  RoleResDTO,
  RoleSaveReqDTO,
  RoleSimpleResDTO,
} from './dto/role.dto';
import { RoleRepository } from './repositories/role.repository';
import { RoleMenuRepository } from './repositories/roleMenu.repository';
import { UserRoleRepository } from './repositories/userRole.repository';
import { RoleDO } from './entities/role.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  buildExcelExport,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { ExportError, PermissionError, RoleError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID, SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';
import { isSuperAdmin } from '@/utils/super-admin';
import { LoginUser } from '@/common/decorator/login-user.decorator';

/**
 * 角色 Service
 *
 * 角色类型 {@link RoleTypeEnum}：1 = 系统内置，2 = 自定义。
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  private currentTenantId(): string {
    return TenantContext.requireTenantId(DEFAULT_TENANT_ID);
  }

  /**
   * 创建角色
   */
  async createRole(
    req: RoleSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<number> {
    this.assertCanManageSuperAdminCode(req.code, loginUser);
    const tenantId = this.currentTenantId();
    // 角色编码唯一（租户维度）
    const exists = await this.roleRepository.selectByUnique({
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        RoleError.CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    // create 语义下忽略前端传入的 id（数据库自增）；type=2 表示自定义角色
    return this.roleRepository.insert({
      tenantId,
      name: req.name,
      code: req.code,
      sort: req.sort,
      status: req.status,
      type: 2,
      remark: req.remark ?? null,
    });
  }

  /**
   * 复制角色（含菜单；不含用户绑定）
   */
  async copyRole(
    sourceId: number,
    req: { name: string; code: string },
    loginUser?: LoginUser,
  ): Promise<number> {
    const source = await this.roleRepository.selectById(sourceId);
    if (!source) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    this.assertCanAccessRole(source, loginUser);
    this.assertCanManageSuperAdminCode(req.code, loginUser);
    const tenantId = this.currentTenantId();
    const exists = await this.roleRepository.selectByUnique({
      code: req.code,
    });
    if (exists) {
      throw new HttpException(
        RoleError.CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    const newId = await this.roleRepository.insert({
      tenantId,
      name: req.name,
      code: req.code,
      sort: source.sort,
      status: source.status,
      type: 2,
      remark: source.remark ?? null,
      dataScope: source.dataScope,
      dataScopeDeptIds: source.dataScopeDeptIds ?? [],
    });
    const menuIds = await this.roleMenuRepository.selectMenuIdsByRoleId(
      sourceId,
    );
    if (menuIds.length > 0) {
      await this.roleMenuRepository.replaceRoleMenus(
        newId,
        tenantId,
        menuIds,
      );
    }
    return newId;
  }

  /**
   * 修改角色
   */
  async updateRole(
    req: RoleSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(RoleError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const role = await this.roleRepository.selectById(id);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    this.assertCanAccessRole(role, loginUser);
    if (this.isBuiltIn(role)) {
      throw new HttpException(
        RoleError.BUILTIN_CANNOT_MODIFY,
        HttpStatus.BAD_REQUEST,
      );
    }
    this.assertCanManageSuperAdminCode(req.code, loginUser);
    // 角色编码唯一（排除自身）
    const conflict = await this.roleRepository.selectByUnique({
      code: req.code,
      id: { not: id },
    });
    if (conflict) {
      throw new HttpException(
        RoleError.CODE_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.roleRepository.updateById(id, {
      name: req.name,
      code: req.code,
      sort: req.sort,
      status: req.status,
      remark: req.remark ?? role.remark,
    });
  }

  /**
   * 删除角色
   */
  async deleteRole(id: number, loginUser?: LoginUser): Promise<boolean> {
    const role = await this.roleRepository.selectById(id);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    this.assertCanAccessRole(role, loginUser);
    await this.checkDeleteable(role);
    await this.roleRepository.deleteById(id);
    // 级联软删角色-菜单关联
    await this.roleMenuRepository.deleteByRoleIds([id]);
    return true;
  }

  /**
   * 批量删除角色
   */
  async deleteRoleList(
    ids: number[],
    loginUser?: LoginUser,
  ): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    for (const id of ids) {
      const role = await this.roleRepository.selectById(id);
      if (!role) {
        throw new HttpException(
          RoleError.NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      this.assertCanAccessRole(role, loginUser);
      await this.checkDeleteable(role);
    }
    await this.roleRepository.deleteBatchIds(ids);
    // 级联软删角色-菜单/用户关联
    await this.roleMenuRepository.deleteByRoleIds(ids);
    await this.userRoleRepository.deleteByRoleIds(ids);
    return true;
  }

  /**
   * 获取角色详情
   */
  async getRole(id: number, loginUser?: LoginUser): Promise<RoleResDTO> {
    const role = await this.roleRepository.selectById(id);
    if (!role) {
      throw new HttpException(
        RoleError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    this.assertCanAccessRole(role, loginUser);
    return this.toResDTO(role);
  }

  /**
   * 获取角色分页列表
   */
  async getRolePage(
    req: RolePageReqDTO,
    loginUser?: LoginUser,
  ): Promise<PageResult<RoleResDTO>> {
    const and: Record<string, unknown>[] = [];
    if (req.name) and.push({ name: { contains: req.name } });
    if (req.code) and.push({ code: { contains: req.code } });
    if (req.status !== undefined) and.push({ status: req.status });
    if (req.createTime && req.createTime.length === 2) {
      and.push({
        createTime: {
          gte: new Date(req.createTime[0]),
          lte: new Date(req.createTime[1]),
        },
      });
    }
    if (!this.isCallerSuperAdmin(loginUser)) {
      and.push({ code: { not: SYSTEM_ADMIN_ROLE_CODE } });
    }
    const where =
      and.length === 0 ? {} : and.length === 1 ? and[0] : { AND: and };
    const { list, total } = await this.roleRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((role) => this.toResDTO(role)), total };
  }

  /**
   * 获取角色精简信息列表（仅启用）
   */
  async getSimpleRoleList(loginUser?: LoginUser): Promise<RoleSimpleResDTO[]> {
    const list = await this.roleRepository.selectList({ status: 1 });
    const filtered = this.isCallerSuperAdmin(loginUser)
      ? list
      : list.filter((r) => r.code !== SYSTEM_ADMIN_ROLE_CODE);
    return filtered.map((role) => {
      const resp = new RoleSimpleResDTO();
      resp.id = role.id;
      resp.name = role.name;
      return resp;
    });
  }

  /**
   * 导出角色 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(): Promise<ExcelExportResult> {
    const { list } = await this.roleRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      {},
    );
    const rows = list.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
      remark: role.remark ?? '',
      createTime: formatDate(role.createTime),
    }));
    return buildExcelExport({
      sheetName: xl(ExportError.ROLE),
      filename: `${xl(ExportError.ROLE)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.NAME), key: 'name', width: 18 },
        { header: xl(ExportError.PERMISSION), key: 'code', width: 18 },
        { header: xl(ExportError.SORT), key: 'sort', width: 10 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.REMARK), key: 'remark', width: 24 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 是否为系统内置角色（type=1）
   */
  private isBuiltIn(role: RoleDO): boolean {
    return role.type === 1;
  }

  private isCallerSuperAdmin(loginUser?: LoginUser): boolean {
    return isSuperAdmin(loginUser?.roles);
  }

  /** 非超管不可查看/改删 super_admin 角色 */
  private assertCanAccessRole(role: RoleDO, loginUser?: LoginUser): void {
    if (
      role.code === SYSTEM_ADMIN_ROLE_CODE &&
      !this.isCallerSuperAdmin(loginUser)
    ) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertCanManageSuperAdminCode(
    code: string | undefined,
    loginUser?: LoginUser,
  ): void {
    if (code === SYSTEM_ADMIN_ROLE_CODE && !this.isCallerSuperAdmin(loginUser)) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * 删除前置校验：系统内置角色不可删除、被用户引用的角色不可删除
   */
  private async checkDeleteable(role: RoleDO): Promise<void> {
    if (this.isBuiltIn(role)) {
      throw new HttpException(
        RoleError.BUILTIN_CANNOT_DELETE,
        HttpStatus.BAD_REQUEST,
      );
    }
    const userCount = await this.userRoleRepository.countByRoleId(role.id);
    if (userCount > 0) {
      throw new HttpException(
        RoleError.IN_USE_CANNOT_DELETE,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 角色 DO → ResDTO
   */
  private toResDTO(role: RoleDO): RoleResDTO {
    const resp = new RoleResDTO();
    resp.id = role.id;
    resp.name = role.name;
    resp.code = role.code;
    resp.sort = role.sort;
    resp.status = role.status;
    resp.type = role.type;
    resp.remark = role.remark ?? undefined;
    resp.dataScope = role.dataScope;
    resp.dataScopeDeptIds = Array.isArray(role.dataScopeDeptIds)
      ? role.dataScopeDeptIds
      : [];
    resp.createTime = formatDate(role.createTime);
    return resp;
  }
}
