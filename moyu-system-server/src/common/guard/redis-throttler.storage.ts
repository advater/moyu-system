import type { ThrottlerStorage } from '@nestjs/throttler';
import type { RedisClientType } from 'redis';

type StorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

/**
 * 多实例共享的限流计数。内存存储在集群下会各自计数，且反向代理后
 * 所有客户端若落到同一网关 IP 会被当成一个人。
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisClientType) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<StorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:block:${key}`;

    const blockedMs = await this.redis.pTTL(blockKey);
    if (blockedMs > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(1, Math.ceil(blockedMs / 1000)),
      };
    }

    const hits = await this.redis.incr(hitsKey);
    if (hits === 1) {
      await this.redis.pExpire(hitsKey, ttl);
    }

    const expireMs = await this.redis.pTTL(hitsKey);
    const timeToExpire = Math.max(1, Math.ceil(Math.max(expireMs, 0) / 1000));

    if (hits > limit) {
      await this.redis.set(blockKey, '1', { PX: blockDuration });
      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.max(1, Math.ceil(blockDuration / 1000)),
      };
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
