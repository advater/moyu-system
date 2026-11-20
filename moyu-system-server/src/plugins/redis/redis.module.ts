/**
 * Redis 全局模块
 *
 * 启动时按 config.yaml / .env 连接真实 Redis；连接失败则拒绝启动（不做内存降级）。
 * 导出 REDIS_CLIENT 与 RedisService。
 */
import { Global, Module, DynamicModule, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { getRedisConfig } from '@/config/database.config';

/** 首次连接超时（毫秒） */
const CONNECT_TIMEOUT_MS = 5_000;

/** 将 Redis/网络错误格式化为可读字符串 */
function formatRedisError(err: unknown): string {
  if (err == null) return 'unknown error';
  if (typeof err === 'string') return err || 'unknown error';
  if (err instanceof Error) {
    const anyErr = err as Error & { code?: string; errno?: number };
    const parts = [
      anyErr.message?.trim(),
      anyErr.code,
      anyErr.errno != null ? `errno=${anyErr.errno}` : undefined,
    ].filter((p): p is string => !!p);
    if (parts.length > 0) return parts.join(' | ');
    return err.name || 'Error';
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'unserializable redis error';
  }
}

@Global()
@Module({})
export class RedisModule {
  private static readonly logger = new Logger(RedisModule.name);

  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: async () => {
            const redisConfig = getRedisConfig();
            const endpoint = `${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`;
            const { createClient } = await import('redis');

            const client = createClient({
              socket: {
                host: redisConfig.host,
                port: redisConfig.port,
                connectTimeout: CONNECT_TIMEOUT_MS,
                // 标准重连：断线后指数退避，上限 3s
                reconnectStrategy: (retries: number) =>
                  Math.min(retries * 100, 3_000),
              },
              password: redisConfig.password || undefined,
              database: redisConfig.db,
            });

            client.on('error', (err: unknown) => {
              RedisModule.logger.error(
                `Redis 错误 (${endpoint}): ${formatRedisError(err)}`,
              );
            });

            try {
              await client.connect();
              await client.ping();
            } catch (err) {
              try {
                client.removeAllListeners('error');
                if (client.isOpen) {
                  await client.quit();
                } else {
                  client.destroy?.();
                }
              } catch {
                /* ignore cleanup */
              }
              const reason = formatRedisError(err);
              RedisModule.logger.error(
                `Redis 连接失败 (${endpoint}): ${reason}。请确认 Docker/Redis 已启动，且 config.yaml redis 配置正确。`,
              );
              throw err instanceof Error ? err : new Error(reason);
            }

            RedisModule.logger.log(`Redis 连接成功: ${endpoint}`);
            return client;
          },
        },
        RedisService,
      ],
      exports: ['REDIS_CLIENT', RedisService],
    };
  }
}
