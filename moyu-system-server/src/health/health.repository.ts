import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * 健康检查数据访问层
 *
 * 数据库探测必须在本仓库内执行，禁止在 HealthService 中直接调用 Prisma。
 */
@Injectable()
export class HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 探测数据库连通性（SELECT 1）
   * @throws 连接失败时向上抛出，由 Service 组装 HealthIndicatorResult
   */
  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
