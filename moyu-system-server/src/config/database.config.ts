import { configYaml } from './yaml';

/** 获取 Redis 连接配置
 *
 * 配置来源优先级：
 *   - host / port / db → .env（REDIS_HOST / REDIS_PORT / REDIS_DB）> config.yaml.redis
 *   - password → .env 的 REDIS_PASSWORD
 *
 * 默认值：localhost:6379 / db0 / 无密码
 */
interface RedisConfig {
  host: string;
  port: number;
  password: string | undefined;
  db: number;
}

export const getRedisConfig = (): RedisConfig => {
  const yamlConfig = configYaml();
  const redisConfig = yamlConfig.redis;

  const portFromEnv = process.env.REDIS_PORT
    ? Number(process.env.REDIS_PORT)
    : undefined;
  const dbFromEnv = process.env.REDIS_DB
    ? Number(process.env.REDIS_DB)
    : undefined;

  return {
    host: process.env.REDIS_HOST || redisConfig?.host || 'localhost',
    port:
      (Number.isFinite(portFromEnv) ? portFromEnv : undefined) ||
      redisConfig?.port ||
      6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db:
      (Number.isFinite(dbFromEnv) ? dbFromEnv : undefined) ??
      redisConfig?.db ??
      0,
  };
};