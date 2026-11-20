import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OAuth2AccessTokenDO } from '../entities/oauth2AccessToken.entity';

/**
 * OAuth2 访问令牌管理仓库
 */
@Injectable()
export class OAuth2TokenRepository {
  constructor(private prisma: PrismaService) {}

  /** 根据访问令牌查询（软删除过滤由 PrismaService 全局处理） */
  async selectByAccessToken(accessToken: string): Promise<OAuth2AccessTokenDO | null> {
    const row = await this.prisma.sysOAuth2AccessToken.findFirst({
      where: { accessToken },
    });
    return (row as OAuth2AccessTokenDO | null) ?? null;
  }

  /** 查询访问令牌列表（不分页） */
  async selectList(
    where?: Prisma.SysOAuth2AccessTokenWhereInput,
  ): Promise<OAuth2AccessTokenDO[]> {
    return this.prisma.sysOAuth2AccessToken.findMany({
      where,
      orderBy: { id: 'desc' },
    }) as Promise<OAuth2AccessTokenDO[]>;
  }

  /** 分页查询访问令牌 */
  async selectPage(
    params: { page: number; pageSize: number },
    where?: Prisma.SysOAuth2AccessTokenWhereInput,
  ): Promise<{ list: OAuth2AccessTokenDO[]; total: number }> {
    const { page, pageSize } = params;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sysOAuth2AccessToken.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sysOAuth2AccessToken.count({ where }),
    ]);
    return { list: rows as OAuth2AccessTokenDO[], total };
  }

  /** 插入访问令牌，返回自增编号 */
  async insert(data: Prisma.SysOAuth2AccessTokenUncheckedCreateInput): Promise<number> {
    const row = await this.prisma.sysOAuth2AccessToken.create({ data });
    return row.id;
  }

  /** 根据刷新令牌软删除关联的访问令牌 */
  async deleteByRefreshToken(refreshToken: string): Promise<boolean> {
    const result = await this.prisma.sysOAuth2AccessToken.updateMany({
      where: { refreshToken },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /** 根据访问令牌软删除 */
  async deleteByAccessToken(accessToken: string): Promise<boolean> {
    const result = await this.prisma.sysOAuth2AccessToken.updateMany({
      where: { accessToken },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /** 批量软删除访问令牌 */
  async deleteByAccessTokens(accessTokens: string[]): Promise<boolean> {
    if (!accessTokens || accessTokens.length === 0) {
      return false;
    }
    const result = await this.prisma.sysOAuth2AccessToken.updateMany({
      where: { accessToken: { in: accessTokens } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return result.count > 0;
  }

  /** 按用户软删全部未过期访问令牌 */
  async deleteByUserId(
    userId: number,
    userType?: number,
  ): Promise<{ count: number; refreshTokens: string[] }> {
    const where: Prisma.SysOAuth2AccessTokenWhereInput = {
      userId,
      expiresTime: { gt: new Date() },
      ...(userType !== undefined ? { userType } : {}),
    };
    const rows = await this.prisma.sysOAuth2AccessToken.findMany({
      where,
      select: { accessToken: true, refreshToken: true },
    });
    if (!rows.length) return { count: 0, refreshTokens: [] };
    await this.prisma.sysOAuth2AccessToken.updateMany({
      where: { accessToken: { in: rows.map((r) => r.accessToken) } },
      data: { deleted: true, deletedAt: new Date() },
    });
    return {
      count: rows.length,
      refreshTokens: rows.map((r) => r.refreshToken),
    };
  }
}
