import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ConfigPageReqDTO,
  ConfigResDTO,
  ConfigSaveReqDTO,
  ConfigSimpleResDTO,
} from './dto/config.dto';
import { ConfigRepository } from './repositories/config.repository';
import { ConfigDO } from './entities/config.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, ConfigError } from '@/config/error-messages';
import { RedisService } from '@/plugins/redis/redis.service';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

const CONFIG_CACHE_PREFIX = 'sys:config';
const CONFIG_CACHE_TTL_MS = 10 * 60_000;

/**
 * 参数配置 Service（租户隔离 + Redis 短缓存）
 */
@Injectable()
export class ConfigService {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly redisService: RedisService,
  ) {}

  private currentTenantId(): string {
    return TenantContext.requireTenantId(DEFAULT_TENANT_ID);
  }

  private cacheKey(tenantId: string, configKey: string): string {
    return `${CONFIG_CACHE_PREFIX}:${tenantId}:${configKey}`;
  }

  private async invalidateCache(
    tenantId: string,
    configKey: string,
  ): Promise<void> {
    await this.redisService.delete(this.cacheKey(tenantId, configKey));
  }

  async createConfig(req: ConfigSaveReqDTO): Promise<number> {
    const tenantId = this.currentTenantId();
    const exists = await this.configRepository.selectByUnique({
      configKey: req.configKey,
    });
    if (exists) {
      throw new HttpException(
        ConfigError.KEY_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    const id = await this.configRepository.insert({
      tenantId,
      category: req.category ?? null,
      name: req.name,
      configKey: req.configKey,
      value: req.value,
      visible: req.visible,
      remark: req.remark ?? null,
    });
    await this.invalidateCache(tenantId, req.configKey);
    return id;
  }

  async updateConfig(req: ConfigSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const tenantId = this.currentTenantId();
    const existing = await this.configRepository.selectById(req.id);
    if (!existing) {
      throw new HttpException(
        ConfigError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const conflict = await this.configRepository.selectByUnique({
      configKey: req.configKey,
      id: { not: req.id },
    });
    if (conflict) {
      throw new HttpException(
        ConfigError.KEY_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ok = await this.configRepository.updateById(req.id, {
      category: req.category ?? null,
      name: req.name,
      configKey: req.configKey,
      value: req.value,
      visible: req.visible,
      remark: req.remark ?? existing.remark,
    });
    await this.invalidateCache(tenantId, existing.configKey);
    if (existing.configKey !== req.configKey) {
      await this.invalidateCache(tenantId, req.configKey);
    }
    return ok;
  }

  async deleteConfig(id: number): Promise<boolean> {
    const existing = await this.configRepository.selectById(id);
    if (!existing) {
      throw new HttpException(
        ConfigError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const ok = await this.configRepository.deleteById(id);
    await this.invalidateCache(this.currentTenantId(), existing.configKey);
    return ok;
  }

  async deleteConfigList(ids: number[]): Promise<boolean> {
    if (!ids?.length) return false;
    for (const id of ids) {
      await this.deleteConfig(id);
    }
    return true;
  }

  async getConfig(id: number): Promise<ConfigResDTO> {
    const row = await this.configRepository.selectById(id);
    if (!row) {
      throw new HttpException(
        ConfigError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(row);
  }

  async getConfigPage(
    query: ConfigPageReqDTO,
  ): Promise<PageResult<ConfigResDTO>> {
    const where = {
      ...(query.name ? { name: { contains: query.name } } : {}),
      ...(query.configKey
        ? { configKey: { contains: query.configKey } }
        : {}),
      ...(query.category ? { category: query.category } : {}),
    };
    const { list, total } = await this.configRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((row) => this.toResDTO(row)), total };
  }

  /** 可见参数精简列表（前端下拉/展示） */
  async getSimpleConfigList(): Promise<ConfigSimpleResDTO[]> {
    const list = await this.configRepository.selectList({ visible: true });
    return list.map((row) => {
      const resp = new ConfigSimpleResDTO();
      resp.id = row.id;
      resp.name = row.name;
      resp.configKey = row.configKey;
      resp.value = row.value;
      return resp;
    });
  }

  /**
   * 按键读取配置值（带缓存；不存在返回 undefined）
   */
  async getValueByKey(configKey: string): Promise<string | undefined> {
    const tenantId = this.currentTenantId();
    const key = this.cacheKey(tenantId, configKey);
    const cached = await this.redisService.get<string>(key);
    if (cached !== undefined) {
      return cached;
    }
    const row = await this.configRepository.selectByUnique({
      configKey,
    });
    if (!row) return undefined;
    await this.redisService.set(key, row.value, CONFIG_CACHE_TTL_MS);
    return row.value;
  }

  private toResDTO(row: ConfigDO): ConfigResDTO {
    const resp = new ConfigResDTO();
    resp.id = row.id;
    resp.category = row.category ?? undefined;
    resp.name = row.name;
    resp.configKey = row.configKey;
    resp.value = row.value;
    resp.visible = row.visible;
    resp.remark = row.remark ?? undefined;
    resp.createTime = formatDate(row.createTime);
    return resp;
  }
}
