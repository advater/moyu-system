import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthRepository } from './health.repository';
import { PrismaModule } from '@/database/prisma/prisma.module';
import { MAIL_SEND_QUEUE, SMS_SEND_QUEUE } from '@/config/constants';
import { RequestMetricsModule } from '@/common/metrics/request-metrics.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    RequestMetricsModule,
    BullModule.registerQueue(
      { name: MAIL_SEND_QUEUE },
      { name: SMS_SEND_QUEUE },
    ),
  ],
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
})
export class HealthModule {}
