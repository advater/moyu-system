import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { OAuth2ApproveDO } from '../entities/oauth2Approve.entity';
import { ensureTenantId } from '@/common/tenant/tenant-write';

/**
 * OAuth2 授权批准仓库
 */
@Injectable()
export class OAuth2ApproveRepository {
  constructor(private prisma: PrismaService) {}

  async selectList(
    where?: Prisma.SysOAuth2ApproveWhereInput,
  ): Promise<OAuth2ApproveDO[]> {
    return this.prisma.sysOAuth2Approve.findMany({
      where,
      orderBy: { id: 'asc' },
    }) as Promise<OAuth2ApproveDO[]>;
  }

  async selectByUnique(
    userId: number,
    userType: number,
    clientId: string,
    scope: string,
  ): Promise<OAuth2ApproveDO | null> {
    const row = await this.prisma.sysOAuth2Approve.findFirst({
      where: { userId, userType, clientId, scope },
    });
    return (row as OAuth2ApproveDO | null) ?? null;
  }

  async upsert(data: {
    userId: number;
    userType: number;
    clientId: string;
    scope: string;
    approved: boolean;
    expiresTime: Date;
    tenantId?: string;
  }): Promise<OAuth2ApproveDO> {
    const exist = await this.selectByUnique(
      data.userId,
      data.userType,
      data.clientId,
      data.scope,
    );
    if (exist) {
      await this.prisma.sysOAuth2Approve.updateMany({
        where: { id: exist.id },
        data: {
          approved: data.approved,
          expiresTime: data.expiresTime,
        },
      });
      return { ...exist, approved: data.approved, expiresTime: data.expiresTime };
    }
    const row = await this.prisma.sysOAuth2Approve.create({
      data: ensureTenantId({
        userId: data.userId,
        userType: data.userType,
        clientId: data.clientId,
        scope: data.scope,
        approved: data.approved,
        expiresTime: data.expiresTime,
        tenantId: data.tenantId,
      }),
    });
    return row as OAuth2ApproveDO;
  }
}
