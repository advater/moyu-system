import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { UserProfileDO } from '../entities/userProfile.entity';
import { ensureTenantId } from '@/common/tenant/tenant-write';

export type UserProfileWrite = {
  nickname?: string | null;
  email?: string | null;
  mobile?: string | null;
  sex?: number | null;
  avatar?: string | null;
  tenantId?: string;
};

/**
 * 用户个人资料仓库（sys_user_profile）
 */
@Injectable()
export class UserProfileRepository {
  constructor(private prisma: PrismaService) {}

  async selectByUserId(userId: number): Promise<UserProfileDO | null> {
    const row = await this.prisma.sysUserProfile.findFirst({
      where: { userId },
    });
    return (row as UserProfileDO | null) ?? null;
  }

  async selectByUserIds(userIds: number[]): Promise<UserProfileDO[]> {
    if (!userIds.length) return [];
    return this.prisma.sysUserProfile.findMany({
      where: { userId: { in: userIds } },
    }) as Promise<UserProfileDO[]>;
  }

  async selectByUnique(
    where: Prisma.SysUserProfileWhereInput,
  ): Promise<UserProfileDO | null> {
    const row = await this.prisma.sysUserProfile.findFirst({ where });
    return (row as UserProfileDO | null) ?? null;
  }

  async selectUserIdsByNicknameContains(nickname: string): Promise<number[]> {
    const rows = await this.prisma.sysUserProfile.findMany({
      where: { nickname: { contains: nickname } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async selectUserIdsByMobileContains(mobile: string): Promise<number[]> {
    const rows = await this.prisma.sysUserProfile.findMany({
      where: { mobile: { contains: mobile } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  /** 按 userId upsert；仅写入 data 中出现的资料字段；空串邮箱/手机写为 null */
  async upsertByUserId(
    userId: number,
    data: UserProfileWrite,
  ): Promise<UserProfileDO> {
    const norm = (v: string | null | undefined) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const t = String(v).trim();
      return t === '' ? null : t;
    };
    const email = data.email !== undefined ? norm(data.email) : undefined;
    const mobile = data.mobile !== undefined ? norm(data.mobile) : undefined;
    const withTenant = ensureTenantId({ ...data, userId });
    const createData = {
      tenantId: withTenant.tenantId,
      userId,
      nickname: data.nickname !== undefined ? data.nickname : null,
      email: email !== undefined ? email : null,
      mobile: mobile !== undefined ? mobile : null,
      sex: data.sex !== undefined ? data.sex : null,
      avatar: data.avatar !== undefined ? data.avatar : null,
    };
    const updateData: Prisma.SysUserProfileUncheckedUpdateInput = {
      deleted: false,
      deletedAt: null,
    };
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (data.sex !== undefined) updateData.sex = data.sex;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    const row = await this.prisma.sysUserProfile.upsert({
      where: { userId },
      create: createData,
      update: updateData,
    });
    return row as UserProfileDO;
  }

  async softDeleteByUserIds(userIds: number[]): Promise<void> {
    if (!userIds.length) return;
    await this.prisma.sysUserProfile.updateMany({
      where: { userId: { in: userIds } },
      data: {
        email: null,
        mobile: null,
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
