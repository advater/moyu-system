import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  MenuListReqDTO,
  MenuResDTO,
  MenuSaveDTO,
  MenuSimpleResDTO,
} from './dto/menu.dto';
import { MenuRepository } from './repositories/menu.repository';
import { MenuDO } from './entities/menu.entity';
import { formatDate } from '@/utils/date';
import { MenuError, PermissionError } from '@/config/error-messages';
import { i18nKey } from '@/i18n';
import {
  SYSTEM_MENU_ROOT_NAME,
  SYSTEM_MENU_ROOT_PATH,
} from '@/config/constants';

/**
 * 菜单管理 Service
 */
@Injectable()
export class MenuService {
  constructor(private readonly menuRepository: MenuRepository) {}

  /**
   * 创建菜单
   */
  async createMenu(req: MenuSaveDTO): Promise<number> {
    await this.validateParent(req.parentId, req.id);
    const lockVisible = await this.isSystemManageLocked(null, req.parentId);
    return this.menuRepository.insert({
      name: req.name,
      permission: req.permission ?? null,
      type: req.type,
      sort: req.sort,
      parentId: req.parentId,
      path: req.path ?? null,
      icon: req.icon ?? null,
      component: req.component ?? null,
      componentName: req.componentName ?? null,
      status: req.status,
      visible: lockVisible ? true : (req.visible ?? true),
      keepAlive: req.keepAlive ?? false,
      alwaysShow: req.alwaysShow ?? false,
    });
  }

  /**
   * 更新菜单
   */
  async updateMenu(req: MenuSaveDTO): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(MenuError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const menu = await this.menuRepository.selectById(id);
    if (!menu) {
      throw new HttpException(
        PermissionError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.validateParent(req.parentId, id);
    await this.assertSystemManageStatus(menu, req.status);
    const lockVisible = await this.isInSystemManageTree(menu);
    return this.menuRepository.updateById(id, {
      name: req.name,
      permission: pickNullable(req.permission, menu.permission),
      type: req.type,
      sort: req.sort,
      parentId: req.parentId,
      path: pickNullable(req.path, menu.path),
      icon: pickNullable(req.icon, menu.icon),
      component: pickNullable(req.component, menu.component),
      componentName: pickNullable(req.componentName, menu.componentName),
      status: req.status,
      visible: lockVisible ? true : (req.visible ?? menu.visible),
      keepAlive: req.keepAlive ?? menu.keepAlive,
      alwaysShow: req.alwaysShow ?? menu.alwaysShow,
    });
  }

  /**
   * 删除菜单
   */
  async deleteMenu(id: number): Promise<boolean> {
    const menu = await this.menuRepository.selectById(id);
    if (!menu) {
      throw new HttpException(
        PermissionError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.checkDeleteable(id);
    return this.menuRepository.deleteById(id);
  }

  /**
   * 批量删除菜单
   */
  async deleteMenuList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    for (const id of ids) {
      const menu = await this.menuRepository.selectById(id);
      if (!menu) {
        throw new HttpException(
          PermissionError.NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      await this.checkDeleteable(id);
    }
    return this.menuRepository.deleteBatchIds(ids);
  }

  /**
   * 获取菜单列表（不分页）
   */
  async getMenuList(req: MenuListReqDTO): Promise<MenuResDTO[]> {
    const list = await this.menuRepository.selectList({
      ...(req.name ? { name: { contains: req.name } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
    });
    return list.map((menu) => this.toResDTO(menu));
  }

  /**
   * 获取菜单精简信息列表（仅启用）
   */
  async getSimpleMenuList(): Promise<MenuSimpleResDTO[]> {
    const list = await this.menuRepository.selectList({ status: 1 });
    return list.map((menu) => {
      const resp = new MenuSimpleResDTO();
      resp.id = menu.id;
      resp.name = menu.name;
      resp.parentId = menu.parentId;
      resp.type = menu.type;
      return resp;
    });
  }

  /**
   * 获取菜单详情
   */
  async getMenu(id: number): Promise<MenuResDTO> {
    const menu = await this.menuRepository.selectById(id);
    if (!menu) {
      throw new HttpException(
        PermissionError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(menu);
  }

  /**
   * 校验父菜单存在性，且父菜单不能是自己/自己的子孙（避免形成环）
   */
  private async validateParent(parentId: number, selfId?: number): Promise<void> {
    if (parentId === 0) {
      return;
    }
    if (selfId !== undefined && parentId === selfId) {
      throw new HttpException(
        MenuError.PARENT_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }
    const parent = await this.menuRepository.selectById(parentId);
    if (!parent) {
      throw new HttpException(MenuError.PARENT_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    // 按钮不能作为父级
    if (parent.type === 3) {
      throw new HttpException(
        MenuError.PARENT_NOT_DIR_OR_MENU,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (selfId === undefined) {
      return;
    }
    // 沿 parentId 向上走，若碰到自己说明选了子孙，会成环
    let currentId = parent.parentId;
    const seen = new Set<number>([parentId]);
    while (currentId && currentId !== 0) {
      if (currentId === selfId) {
        throw new HttpException(
          MenuError.PARENT_SELF,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (seen.has(currentId)) {
        break;
      }
      seen.add(currentId);
      const ancestor = await this.menuRepository.selectById(currentId);
      if (!ancestor) {
        break;
      }
      currentId = ancestor.parentId;
    }
  }

  /**
   * 删除前置校验：不能存在子菜单、不能被角色引用
   */
  private async checkDeleteable(id: number): Promise<void> {
    const childCount = await this.menuRepository.countByParentId(id);
    if (childCount > 0) {
      throw new HttpException(MenuError.HAS_CHILDREN, HttpStatus.BAD_REQUEST);
    }
    const roleCount = await this.menuRepository.countRoleMenuByMenuId(id);
    if (roleCount > 0) {
      throw new HttpException(
        i18nKey(PermissionError.IN_USE_BY_ROLES, {
          count: roleCount,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 系统管理及其子菜单禁止修改状态，避免把后台目录关掉
   */
  private async assertSystemManageStatus(
    menu: MenuDO,
    nextStatus: number,
  ): Promise<void> {
    if (nextStatus === menu.status) {
      return;
    }
    if (await this.isInSystemManageTree(menu)) {
      throw new HttpException(
        MenuError.STATUS_CANNOT_MODIFY,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async isSystemManageLocked(
    menu: MenuDO | null,
    parentId?: number,
  ): Promise<boolean> {
    if (menu && (await this.isInSystemManageTree(menu))) {
      return true;
    }
    if (parentId && parentId !== 0) {
      const parent = await this.menuRepository.selectById(parentId);
      if (parent && (await this.isInSystemManageTree(parent))) {
        return true;
      }
    }
    return false;
  }

  private isSystemManageRoot(menu: MenuDO): boolean {
    if (menu.id === 1) {
      return true;
    }
    if (menu.path === SYSTEM_MENU_ROOT_PATH) {
      return true;
    }
    return menu.parentId === 0 && menu.name === SYSTEM_MENU_ROOT_NAME;
  }

  private async isInSystemManageTree(menu: MenuDO): Promise<boolean> {
    let current: MenuDO | null = menu;
    const seen = new Set<number>();
    while (current) {
      if (this.isSystemManageRoot(current)) {
        return true;
      }
      if (!current.parentId || current.parentId === 0) {
        return false;
      }
      if (seen.has(current.id)) {
        return false;
      }
      seen.add(current.id);
      current = await this.menuRepository.selectById(current.parentId);
    }
    return false;
  }

  /**
   * 菜单 DO → ResDTO
   */
  private toResDTO(menu: MenuDO): MenuResDTO {
    const resp = new MenuResDTO();
    resp.id = menu.id;
    resp.name = menu.name;
    resp.permission = menu.permission ?? undefined;
    resp.type = menu.type;
    resp.sort = menu.sort;
    resp.parentId = menu.parentId;
    resp.path = menu.path ?? undefined;
    resp.icon = menu.icon ?? undefined;
    resp.component = menu.component ?? undefined;
    resp.componentName = menu.componentName ?? undefined;
    resp.status = menu.status;
    resp.visible = menu.visible;
    resp.keepAlive = menu.keepAlive;
    resp.alwaysShow = menu.alwaysShow;
    resp.createTime = formatDate(menu.createTime);
    return resp;
  }
}

/** 未传则保留原值；显式空串/null 则清空 */
function pickNullable(
  incoming: string | null | undefined,
  fallback: string | null,
): string | null {
  if (incoming === undefined) return fallback;
  return incoming ? incoming : null;
}
