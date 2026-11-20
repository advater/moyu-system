import { Injectable, Optional } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { RedisService } from '@/plugins/redis/redis.service';
import { HealthRepository } from './health.repository';
import { MAIL_SEND_QUEUE, SMS_SEND_QUEUE } from '@/config/constants';
import { RequestMetricsService } from '@/common/metrics/request-metrics.service';
import type { RequestMetricsSnapshot } from '@/common/metrics/request-metrics';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly redisService: RedisService,
    private readonly healthRepository: HealthRepository,
    private readonly requestMetrics: RequestMetricsService,
    @Optional()
    @InjectQueue(MAIL_SEND_QUEUE)
    private readonly mailQueue?: Queue,
    @Optional()
    @InjectQueue(SMS_SEND_QUEUE)
    private readonly smsQueue?: Queue,
  ) {}

  metrics(): RequestMetricsSnapshot {
    return this.requestMetrics.snapshot();
  }

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.pingDatabase(),
      () => this.pingRedis(),
      () => this.pingQueues(),
    ]);
  }

  private async pingDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.healthRepository.ping();
      return { database: { status: 'up' } };
    } catch (error) {
      return {
        database: { status: 'down', message: (error as Error).message },
      };
    }
  }

  private async pingRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redisService.set('__health_check__', 'ok', 5000);
      const result = await this.redisService.get('__health_check__');
      await this.redisService.delete('__health_check__');
      if (result === 'ok') {
        return { redis: { status: 'up' } };
      }
      return {
        redis: { status: 'down', message: 'Redis read/write mismatch' },
      };
    } catch (error) {
      return { redis: { status: 'down', message: (error as Error).message } };
    }
  }

  /** 队列深度（waiting）；队列未注入时标记 skip */
  private async pingQueues(): Promise<HealthIndicatorResult> {
    try {
      const mailWaiting = this.mailQueue
        ? await this.mailQueue.getWaitingCount()
        : null;
      const smsWaiting = this.smsQueue
        ? await this.smsQueue.getWaitingCount()
        : null;
      return {
        queues: {
          status: 'up',
          mailWaiting,
          smsWaiting,
        },
      };
    } catch (error) {
      return {
        queues: { status: 'down', message: (error as Error).message },
      };
    }
  }
}
