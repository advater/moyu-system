import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OAuth2RefreshTokenDO } from '../entities/oauth2RefreshToken.entity';

/**
 * OAuth2 刷新令牌管理仓库
 */
@Injectable()
export class OAuth2RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  /** 根据刷新令牌查询（软删除过滤由 PrismaService 全局处理） */
  async selectByRefreshToken(refreshToken: string): Promise<OAuth2RefreshTokenDO | null> {
    const row = await this.prisma.sysOAuth2RefreshToken.findFirst({
      where: { refreshToken },
    });
    return (row as OAuth2RefreshTokenDO | null) ?? null;
  }

  /**
   * 查询已被轮换 / 撤销（软删）的刷新令牌
   *
   * 供重放侦测使用：令牌曾签发但已失效却再次被使用。
   */
  async selectRevokedByRefreshToken(
    refreshToken: string,
  ): Promise<OAuth2RefreshTokenDO | null> {
    const row = await this.prisma.sysOAuth2RefreshToken.findFirst({
      where: { refreshToken, deletedAt: { not: null } },
    });
    return (row as OAuth2RefreshTokenDO | null) ?? null;
  }

  /** 查询家族内全部有效刷新令牌（重放命中时整族吊销） */
  async selectByFamilyId(familyId: string): Promise<OAuth2RefreshTokenDO[]> {
    return this.prisma.sysOAuth2RefreshToken.findMany({
      where: { familyId },
    }) as Promise<OAuth2RefreshTokenDO[]>;
  }

  /** 插入刷新令牌，返回自增编号 */
  async insert(data: Prisma.SysOAuth2RefreshTokenUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysOAuth2RefreshToken.create({ data });
    return row.id;
  }

  /** 根据刷新令牌软删除 */
  async deleteByRefreshToken(refreshToken: string): Promise<boolean> {
    const result = await this.prisma.sysOAuth2RefreshToken.updateMany({
      where: { refreshToken },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /** 根据用户 + 客户端软删除全部刷新令牌（注销场景使用） */
  async deleteByUserIdAndClient(
    userId: number,
    userType: number,
    clientId: string,
  ): Promise<boolean> {
    const result = await this.prisma.sysOAuth2RefreshToken.updateMany({
      where: { userId, userType, clientId },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
