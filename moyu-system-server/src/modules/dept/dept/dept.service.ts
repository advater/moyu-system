import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  DeptListReqDTO,
  DeptResDTO,
  DeptSaveReqDTO,
  DeptSimpleResDTO,
} from './dto/dept.dto';
import { DeptRepository } from './repositories/dept.repository';
import { DeptDO } from './entities/dept.entity';
import { formatDate } from '@/utils/date';
import { DeptError, PermissionError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import { DataScopeService } from '@/modules/permission/permission/data-scope.service';
import type { LoginUser } from '@/common/decorator/login-user.decorator';
import { PrismaService } from '@/database/prisma/prisma.service';
import {
  resolveDeptDeletionBlocker,
  roleReferencesDept,
} from './dept-deletion.util';

/**
 * 部门管理 Service
 */
@Injectable()
export class DeptService {
  constructor(
    private readonly deptRepository: DeptRepository,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => DataScopeService))
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * 创建部门
   */
  async createDept(
    req: DeptSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<number> {
    const exists = await this.deptRepository.selectByUnique({
      name: req.name,
      parentId: req.parentId,
    });
    if (exists) {
      throw new HttpException(DeptError.EXISTS, HttpStatus.BAD_REQUEST);
    }
    // 父部门须存在且在操作者数据权限内（顶级部门 parentId=0 不需要校验）
    if (req.parentId) {
      await this.assertParentUsable(req.parentId, loginUser);
    }
    return this.deptRepository.insert({
      tenantId: TenantContext.requireTenantId(DEFAULT_TENANT_ID),
      name: req.name,
      parentId: req.parentId,
      sort: req.sort ?? 0,
      leaderUserId: req.leaderUserId ?? null,
      phone: req.phone ?? null,
      email: req.email ?? null,
      status: req.status,
    });
  }

  /**
   * 修改部门
   */
  async updateDept(
    req: DeptSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const dept = await this.deptRepository.selectById(req.id);
    if (!dept) {
      throw new HttpException(DeptError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.dataScopeService.assertDeptAccessible(loginUser, dept.id);
    // 父部门变更：校验父部门存在且在数据权限内，且不得移入自身/子孙部门（防环）
    if (req.parentId !== dept.parentId && req.parentId) {
      await this.assertParentUsable(req.parentId, loginUser);
      const subIds = await this.collectSubDeptIds(dept.id);
      if (subIds.includes(req.parentId)) {
        throw new HttpException(DeptError.CYCLE, HttpStatus.BAD_REQUEST);
      }
    }
    const conflict = await this.deptRepository.selectByUnique({
      name: req.name,
      parentId: req.parentId,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(DeptError.EXISTS, HttpStatus.BAD_REQUEST);
    }
    return this.deptRepository.updateById(req.id, {
      name: req.name,
      parentId: req.parentId,
      sort: req.sort ?? dept.sort,
      leaderUserId: req.leaderUserId ?? dept.leaderUserId,
      phone: req.phone ?? dept.phone,
      email: req.email ?? dept.email,
      status: req.status,
    });
  }

  /**
   * 删除部门
   */
  async deleteDept(id: number, loginUser?: LoginUser): Promise<boolean> {
    const dept = await this.deptRepository.selectById(id);
    if (!dept) {
      throw new HttpException(DeptError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.dataScopeService.assertDeptAccessible(loginUser, id);
    await this.assertDeletable(id);
    return this.deptRepository.deleteById(id);
  }

  /**
   * 批量删除部门
   */
  async deleteDeptList(
    ids: number[],
    loginUser?: LoginUser,
  ): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    for (const id of ids) {
      await this.deleteDept(id, loginUser);
    }
    return true;
  }

  /** 子部门 / 下属用户 / 角色 dataScope 引用校验 */
  private async assertDeletable(id: number): Promise<void> {
    const children = await this.deptRepository.selectByUnique({ parentId: id });
    const userCount = await this.prisma.sysUser.count({
      where: { deptId: id },
    });
    const roles = await this.prisma.sysRole.findMany({
      select: { id: true, dataScopeDeptIds: true },
    });
    const referenced = roles.some((r) =>
      roleReferencesDept(r.dataScopeDeptIds, id),
    );
    const blocker = resolveDeptDeletionBlocker({
      hasChildren: !!children,
      userCount,
      referencedByRole: referenced,
    });
    if (blocker) {
      throw new HttpException(DeptError[blocker], HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 获取部门列表（不分页）
   */
  async getDeptList(
    req: DeptListReqDTO,
    loginUser?: LoginUser,
  ): Promise<DeptResDTO[]> {
    const scoped = await this.applyDeptScope(loginUser, this.buildDeptWhere(req));
    const list = await this.deptRepository.selectList(
      scoped as Parameters<typeof this.deptRepository.selectList>[0],
    );
    return list.map((dept) => this.toResDTO(dept));
  }

  /**
   * 获取部门列表（不分页，不受数据权限限制）
   *
   * 仅供内部名称映射等可信场景使用，不得直接暴露给外部接口。
   */
  async getDeptListUnscoped(req: DeptListReqDTO): Promise<DeptResDTO[]> {
    const list = await this.deptRepository.selectList(this.buildDeptWhere(req));
    return list.map((dept) => this.toResDTO(dept));
  }

  private buildDeptWhere(req: DeptListReqDTO): Record<string, unknown> {
    return {
      ...(req.name ? { name: { contains: req.name } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
    };
  }

  /** 校验父部门存在且在操作者数据权限内 */
  private async assertParentUsable(
    parentId: number,
    loginUser: LoginUser | undefined,
  ): Promise<void> {
    const parent = await this.deptRepository.selectById(parentId);
    if (!parent) {
      throw new HttpException(
        DeptError.PARENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.dataScopeService.assertDeptAccessible(loginUser, parentId);
  }

  /** 收集某部门及其全部子孙部门编号（用于部门移动防环） */
  private async collectSubDeptIds(rootId: number): Promise<number[]> {
    const all = await this.deptRepository.selectList({});
    const childrenMap = new Map<number, number[]>();
    for (const dept of all) {
      const list = childrenMap.get(dept.parentId) ?? [];
      list.push(dept.id);
      childrenMap.set(dept.parentId, list);
    }
    const result: number[] = [];
    const walk = (id: number) => {
      result.push(id);
      for (const child of childrenMap.get(id) ?? []) {
        walk(child);
      }
    };
    walk(rootId);
    return result;
  }

  /**
   * 获取部门精简信息列表（仅启用）
   */
  async getSimpleDeptList(loginUser?: LoginUser): Promise<DeptSimpleResDTO[]> {
    const scoped = await this.applyDeptScope(loginUser, { status: 1 });
    return this.deptRepository.selectSimpleList(
      scoped as Parameters<typeof this.deptRepository.selectSimpleList>[0],
    );
  }

  /**
   * 获取部门详情
   */
  async getDept(id: number, loginUser?: LoginUser): Promise<DeptResDTO> {
    const dept = await this.deptRepository.selectById(id);
    if (!dept) {
      throw new HttpException(DeptError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.dataScopeService.assertDeptAccessible(loginUser, id);
    return this.toResDTO(dept);
  }

  private async applyDeptScope(
    loginUser: LoginUser | undefined,
    where: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!loginUser?.id) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
    const scope = await this.dataScopeService.resolveForUser(loginUser);
    const scopeWhere = this.dataScopeService.toDeptWhere(scope);
    if (!scopeWhere) return where;
    if (Object.keys(where).length === 0) return scopeWhere;
    return { AND: [where, scopeWhere] };
  }

  private toResDTO(dept: DeptDO): DeptResDTO {
    const resp = new DeptResDTO();
    resp.id = dept.id;
    resp.name = dept.name;
    resp.parentId = dept.parentId;
    resp.sort = dept.sort;
    resp.leaderUserId = dept.leaderUserId ?? undefined;
    resp.phone = dept.phone ?? undefined;
    resp.email = dept.email ?? undefined;
    resp.status = dept.status;
    resp.createTime = formatDate(dept.createTime);
    return resp;
  }
}
