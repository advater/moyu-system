import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

/**
 * 用户角色关联管理仓库
 */
@Injectable()
export class UserRoleRepository {
  constructor(private prisma: PrismaService) {}

  private tenantId(): string {
    return TenantContext.requireTenantId(DEFAULT_TENANT_ID);
  }

  /**
   * 查询用户拥有的角色编号列表
   */
  async selectRoleIdsByUserId(userId: number): Promise<number[]> {
    const rows = await this.prisma.sysUserRole.findMany({
      where: { userId },
      select: { roleId: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => row.roleId);
  }

  /**
   * 统计指定角色关联的用户数（供角色删除校验使用）
   */
  async countByRoleId(roleId: number): Promise<number> {
    return this.prisma.sysUserRole.count({ where: { roleId } });
  }

  /**
   * 全量替换用户-角色关联（同一事务；软删未选择项 + 幂等恢复已选择项）
   */
  async replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
    const tenantId = this.tenantId();
    await this.prisma.$transaction(async (tx) => {
      const uniq = [...new Set(roleIds)];
      if (uniq.length === 0) {
        await tx.sysUserRole.updateMany({
          where: { userId },
          data: { deleted: true, deletedAt: new Date() },
        });
        return;
      }
      await tx.sysUserRole.updateMany({
        where: { userId, roleId: { notIn: uniq } },
        data: { deleted: true, deletedAt: new Date() },
      });
      for (const roleId of uniq) {
        await tx.sysUserRole.upsert({
          where: {
            tenantId_userId_roleId: { tenantId, userId, roleId },
          },
          create: { tenantId, userId, roleId },
          update: { deleted: false, deletedAt: null },
        });
      }
    });
  }

  /**
   * 软删除指定用户的全部角色关联
   */
  async deleteByUserIds(userIds: number[]): Promise<void> {
    if (!userIds || userIds.length === 0) {
      return;
    }
    await this.prisma.sysUserRole.updateMany({
      where: { userId: { in: userIds } },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  /**
   * 软删除指定角色的全部用户关联
   */
  async deleteByRoleIds(roleIds: number[]): Promise<void> {
    if (!roleIds || roleIds.length === 0) {
      return;
    }
    await this.prisma.sysUserRole.updateMany({
      where: { roleId: { in: roleIds } },
      data: { deleted: true, deletedAt: new Date() },
    });
  }
}
