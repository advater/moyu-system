import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { MenuDO } from '../entities/menu.entity';

/**
 * 菜单管理仓库
 */
@Injectable()
export class MenuRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据编号查询菜单
   */
  async selectById(id: number): Promise<MenuDO | null> {
    const row = await this.prisma.sysMenu.findUnique({ where: { id } });
    return (row as MenuDO | null) ?? null;
  }

  /**
   * 根据编号批量查询菜单
   */
  async selectByIds(ids: number[]): Promise<MenuDO[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.prisma.sysMenu.findMany({
      where: { id: { in: ids } },
      orderBy: { sort: 'asc' },
    }) as Promise<MenuDO[]>;
  }

  /**
   * 查询菜单列表（不分页，按 sort 升序）
   */
  async selectList(where?: Prisma.SysMenuWhereInput): Promise<MenuDO[]> {
    return this.prisma.sysMenu.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    }) as Promise<MenuDO[]>;
  }

  /**
   * 根据条件查询单个菜单（用于唯一性/父子校验）
   */
  async selectByUnique(where: Prisma.SysMenuWhereInput): Promise<MenuDO | null> {
    const row = await this.prisma.sysMenu.findFirst({ where });
    return (row as MenuDO | null) ?? null;
  }

  /**
   * 统计子菜单数量（用于删除校验）
   */
  async countByParentId(parentId: number): Promise<number> {
    return this.prisma.sysMenu.count({ where: { parentId } });
  }

  /**
   * 统计被角色引用的菜单数量（用于删除校验）
   */
  async countRoleMenuByMenuId(menuId: number): Promise<number> {
    return this.prisma.sysRoleMenu.count({ where: { menuId } });
  }

  /**
   * 插入菜单，返回自增编号
   */
  async insert(data: Prisma.SysMenuUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysMenu.create({ data });
    return row.id;
  }

  /**
   * 根据编号更新菜单
   */
  async updateById(
    id: number,
    data: Prisma.SysMenuUncheckedUpdateInput,
  ): Promise<boolean> {
    const result = await this.prisma.sysMenu.updateMany({
      where: { id },
      data,
    });
    return result.count > 0;
  }

  /**
   * 软删除单个菜单
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.sysMenu.updateMany({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 软删除多个菜单
   */
  async deleteBatchIds(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const result = await this.prisma.sysMenu.updateMany({
      where: { id: { in: ids } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
