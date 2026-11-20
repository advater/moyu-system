import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';

/**
 * 角色菜单关联管理仓库
 */
@Injectable()
export class RoleMenuRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 查询角色拥有的菜单编号列表
   */
  async selectMenuIdsByRoleId(roleId: number): Promise<number[]> {
    const rows = await this.prisma.sysRoleMenu.findMany({
      where: { roleId },
      select: { menuId: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => row.menuId);
  }

  /**
   * 查询指定角色绑定指定菜单的记录数（供菜单删除校验使用）
   */
  async countByMenuId(menuId: number): Promise<number> {
    return this.prisma.sysRoleMenu.count({ where: { menuId } });
  }

  /**
   * 全量替换角色-菜单关联（同一事务；软删未选择项 + 幂等恢复已选择项）
   */
  async replaceRoleMenus(
    roleId: number,
    tenantId: string,
    menuIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const uniq = [...new Set(menuIds)];
      if (uniq.length === 0) {
        await tx.sysRoleMenu.updateMany({
          where: { roleId },
          data: { deleted: true, deletedAt: new Date() },
        });
        return;
      }
      // 移除已取消的菜单关联
      await tx.sysRoleMenu.updateMany({
        where: { roleId, menuId: { notIn: uniq } },
        data: { deleted: true, deletedAt: new Date() },
      });
      // 幂等写入/恢复选择的菜单关联
      for (const menuId of uniq) {
        await tx.sysRoleMenu.upsert({
          where: {
            tenantId_roleId_menuId: { tenantId, roleId, menuId },
          },
          create: { tenantId, roleId, menuId },
          update: { deleted: false, deletedAt: null },
        });
      }
    });
  }

  /**
   * 软删除指定角色的全部菜单关联
   */
  async deleteByRoleIds(roleIds: number[]): Promise<void> {
    if (!roleIds || roleIds.length === 0) {
      return;
    }
    await this.prisma.sysRoleMenu.updateMany({
      where: { roleId: { in: roleIds } },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
}
