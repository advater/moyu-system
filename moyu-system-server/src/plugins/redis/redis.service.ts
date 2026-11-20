/**
 * Redis 高层服务
 *
 * 封装 Redis 客户端读写，提供自动 JSON 序列化/反序列化。
 * 依赖 RedisModule 注入的真实 REDIS_CLIENT。
 */
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { toPlainString } from '@/utils/to-plain-string';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly client: RedisClientType,
  ) {}

  /**
   * 获取键值并自动反序列化
   *
   * - 键不存在 → 返回 undefined
   * - 值为 JSON 字符串 → 自动 parse 为对应类型 T
   * - 值为普通字符串 → 原样返回
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    const val = await this.client.get(key);
    if (val === null) return undefined;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  /**
   * 设置键值并自动序列化
   *
   * @param key   键名
   * @param value 值（自动 JSON.stringify）
   * @param ttl   过期时间，单位毫秒；不传则永不过期
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, serialized, { PX: ttl });
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * 删除单个键
   *
   * @returns true 表示键存在且已删除，false 表示键不存在
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  /** 原子自增；键不存在时从 0 开始 */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * 设置过期时间
   * @param ttlMs 毫秒
   */
  async expire(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.client.pExpire(key, ttlMs);
    return Boolean(result);
  }

  /** 剩余生存时间（毫秒）；-1 永不过期；-2 不存在 */
  async pttl(key: string): Promise<number> {
    return this.client.pTTL(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0;
  }

  private isWrongType(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return msg.includes('WRONGTYPE');
  }

  /** 原子写入 Set 成员并返回全部成员（分片序号） */
  async sAddMembers(
    key: string,
    member: string,
    ttlMs?: number,
  ): Promise<string[]> {
    try {
      await this.client.sAdd(key, member);
    } catch (error) {
      if (!this.isWrongType(error)) throw error;
      const legacy = await this.get<unknown>(key);
      await this.client.del(key);
      const prev = (Array.isArray(legacy) ? legacy : legacy != null ? [legacy] : [])
        .map((item) => toPlainString(item))
        .filter((item) => item !== '');
      if (prev.length) await this.client.sAdd(key, prev);
      await this.client.sAdd(key, member);
    }
    if (ttlMs) await this.client.pExpire(key, ttlMs);
    return this.client.sMembers(key);
  }

  async sMembers(key: string): Promise<string[] | undefined> {
    try {
      if (!(await this.exists(key))) return undefined;
      return this.client.sMembers(key);
    } catch (error) {
      if (!this.isWrongType(error)) throw error;
      const legacy = await this.get<unknown>(key);
      if (!Array.isArray(legacy)) return undefined;
      return legacy.map(String);
    }
  }

  async replaceSet(
    key: string,
    members: string[],
    ttlMs?: number,
  ): Promise<void> {
    await this.client.del(key);
    if (members.length) await this.client.sAdd(key, members);
    if (ttlMs && members.length) await this.client.pExpire(key, ttlMs);
  }

  async hSetField(
    key: string,
    field: string,
    value: string,
    ttlMs?: number,
  ): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      if (!this.isWrongType(error)) throw error;
      const legacy =
        (await this.get<Record<string, string>>(key)) || {};
      await this.client.del(key);
      const next = { ...legacy, [field]: value };
      if (Object.keys(next).length) await this.client.hSet(key, next);
    }
    if (ttlMs) await this.client.pExpire(key, ttlMs);
  }

  async hGetAllFields(key: string): Promise<Record<string, string>> {
    try {
      if (!(await this.exists(key))) return {};
      return (await this.client.hGetAll(key)) || {};
    } catch (error) {
      if (!this.isWrongType(error)) throw error;
      return (await this.get<Record<string, string>>(key)) || {};
    }
  }

  /**
   * 按通配符模式批量删除键（SCAN + DEL）
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    let cursor: string | number = '0';
    do {
      const reply = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await this.client.del(reply.keys);
        deletedCount += reply.keys.length;
      }
    } while (String(cursor) !== '0');
    return deletedCount;
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, { NX: true, PX: ttlMs });
    return result === 'OK';
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
