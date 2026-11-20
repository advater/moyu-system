import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { SmsCodeDO } from '../entities/smsCode.entity';
import { ensureTenantId } from '@/common/tenant/tenant-write';

/**
 * 手机验证码仓库
 */
@Injectable()
export class SmsCodeRepository {
  constructor(private prisma: PrismaService) {}

  async selectByMobileAndScene(
    mobile: string,
    scene: number,
  ): Promise<SmsCodeDO | null> {
    const row = await this.prisma.sysSmsCode.findFirst({
      where: { mobile, scene },
      orderBy: { createTime: 'desc' },
    });
    return (row as SmsCodeDO | null) ?? null;
  }

  async selectCountToday(mobile: string, scene: number): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return this.prisma.sysSmsCode.count({
      where: { mobile, scene, createTime: { gte: startOfToday } },
    });
  }

  async insert(data: {
    mobile: string;
    code: string;
    scene: number;
    createIp?: string | null;
    todayIndex?: number;
    tenantId?: string;
  }): Promise<SmsCodeDO> {
    const row = await this.prisma.sysSmsCode.create({
      data: ensureTenantId({
        mobile: data.mobile,
        code: data.code,
        scene: data.scene,
        createIp: data.createIp ?? null,
        todayIndex: data.todayIndex ?? 1,
        tenantId: data.tenantId,
      }),
    });
    return row as SmsCodeDO;
  }

  async markUsed(id: number): Promise<boolean> {
    const result = await this.prisma.sysSmsCode.updateMany({
      where: { id },
      data: { used: true, usedTime: new Date() },
    });
    return result.count > 0;
  }
}
