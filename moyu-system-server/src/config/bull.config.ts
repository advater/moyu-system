import { getRedisConfig } from './database.config';

/**
 * BullMQ Redis 连接配置（与业务 Redis 同实例，逻辑隔离靠 queue name）
 */
export function getBullRedisConnection() {
  const redis = getRedisConfig();
  return {
    host: redis.host,
    port: redis.port,
    password: redis.password || undefined,
    db: redis.db,
  };
}
