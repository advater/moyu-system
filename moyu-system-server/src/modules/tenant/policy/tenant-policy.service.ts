import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { RedisService } from '@/plugins/redis/redis.service';
import { TenantRepository } from '../tenant/repositories/tenant.repository';
import { RoleRepository } from '@/modules/permission/role/repositories/role.repository';
import { RoleMenuRepository } from '@/modules/permission/role/repositories/roleMenu.repository';
import { TenantContext } from '@/common/tenant/tenant.context';
import {
  TENANT_ADMIN_ROLE_CODE,
  TENANT_ACTIVE_CACHE_PREFIX,
  TENANT_ACTIVE_CACHE_TTL_MS,
} from '@/config/constants';
import { TenantError } from '@/config/error-messages';
import { TenantDO } from '../tenant/entities/tenant.entity';
import {
  canCreateUsers,
  isTenantEnabled,
  isTenantExpired,
} from './tenant-policy.util';

/** 租户可用性判定结果（缓存结构；ok=false 时携带错误码与 HTTP 状态） */
interface TenantActiveDecision {
  ok: boolean;
  message: string;
  status: number;
}

/**
 * 租户生命周期策略：启用/过期校验、账号配额、套餐菜单同步
 */
@Injectable()
export class TenantPolicyService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /** 解析租户主键；非法 id 视为不存在 */
  private parseTenantPk(tenantId: string): number {
    const id = Number(String(tenantId).trim());
    if (!Number.isFinite(id) || id < 0) {
      throw new HttpException(
        TenantError.NOT_EXIST_CONTACT_ADMIN,
        HttpStatus.NOT_FOUND,
      );
    }
    return id;
  }

  /**
   * 校验租户存在、启用且未过期；通过则返回租户实体
   */
  async assertTenantActive(tenantId: string): Promise<TenantDO> {
    const id = this.parseTenantPk(tenantId);
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant) {
      throw new HttpException(
        TenantError.NOT_EXIST_CONTACT_ADMIN,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!isTenantEnabled(tenant.status)) {
      throw new HttpException(TenantError.DISABLED, HttpStatus.FORBIDDEN);
    }
    if (isTenantExpired(tenant.expireTime)) {
      throw new HttpException(TenantError.EXPIRED, HttpStatus.FORBIDDEN);
    }
    return tenant;
  }

  /**
   * 请求级租户可用性校验（供 JwtGuard 每个请求调用）
   *
   * 与 assertTenantActive 的差异：
   * - 判定结果缓存 TENANT_ACTIVE_CACHE_TTL_MS，避免每请求查库；
   * - 租户行不存在时不拦截（登录链路已校验，单租户/默认租户可能无 sys_tenant 行）。
   */
  async assertTenantUsable(tenantId: string): Promise<void> {
    const key = `${TENANT_ACTIVE_CACHE_PREFIX}:${tenantId}`;
    const cached = await this.readActiveCache(key);
    if (cached) {
      if (cached.ok) return;
      throw new HttpException(cached.message, cached.status);
    }

    const decision = await this.resolveTenantUsable(tenantId);
    await this.writeActiveCache(key, decision);
    if (!decision.ok) {
      throw new HttpException(decision.message, decision.status);
    }
  }

  /** 无缓存时直查租户状态，得出可用性判定 */
  private async resolveTenantUsable(
    tenantId: string,
  ): Promise<TenantActiveDecision> {
    const usable: TenantActiveDecision = {
      ok: true,
      message: '',
      status: HttpStatus.OK,
    };
    const id = Number(String(tenantId).trim());
    if (!Number.isFinite(id) || id < 0) return usable;
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant) return usable;
    if (!isTenantEnabled(tenant.status)) {
      return {
        ok: false,
        message: TenantError.DISABLED,
        status: HttpStatus.FORBIDDEN,
      };
    }
    if (isTenantExpired(tenant.expireTime)) {
      return {
        ok: false,
        message: TenantError.EXPIRED,
        status: HttpStatus.FORBIDDEN,
      };
    }
    return usable;
  }

  /** Redis 不可用时退化为不缓存（仍按直查结果判定，不影响正确性） */
  private async readActiveCache(
    key: string,
  ): Promise<TenantActiveDecision | undefined> {
    try {
      return await this.redisService.get<TenantActiveDecision>(key);
    } catch {
      return undefined;
    }
  }

  private async writeActiveCache(
    key: string,
    decision: TenantActiveDecision,
  ): Promise<void> {
    try {
      await this.redisService.set(key, decision, TENANT_ACTIVE_CACHE_TTL_MS);
    } catch {
      /* 缓存失败不影响判定 */
    }
  }

  /** 当前租户下未删除用户数 */
  async countUsers(tenantId: string): Promise<number> {
    return TenantContext.run({ tenantId, ignore: false }, () =>
      this.prisma.sysUser.count({}),
    );
  }

  /**
   * 校验还可创建 extra 个用户（accountCount < 0 不限）
   */
  async assertCanCreateUsers(tenantId: string, extra = 1): Promise<void> {
    const tenant = await this.assertTenantActive(tenantId);
    const current = await this.countUsers(tenantId);
    if (!canCreateUsers(tenant.accountCount, current, extra)) {
      throw new HttpException(
        TenantError.ACCOUNT_LIMIT,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 将套餐菜单同步到指定租户的 tenant_admin 角色
   */
  async syncTenantAdminMenus(tenantId: string, menuIds: number[]): Promise<void> {
    const ids = Array.isArray(menuIds) ? menuIds : [];
    await TenantContext.run({ tenantId, ignore: false }, async () => {
      const role = await this.roleRepository.selectByUnique({
        code: TENANT_ADMIN_ROLE_CODE,
      });
      if (!role) {
        return;
      }
      await this.roleMenuRepository.replaceRoleMenus(role.id, tenantId, ids);
    });
  }

  /**
   * 套餐 menuIds 变更后：同步所有使用该套餐的租户管理员菜单
   */
  async syncPackageMenusToTenants(
    packageId: number,
    menuIds: number[],
  ): Promise<number> {
    const tenants = await this.tenantRepository.selectList({ packageId });
    let synced = 0;
    for (const tenant of tenants) {
      await this.syncTenantAdminMenus(String(tenant.id), menuIds);
      synced += 1;
    }
    return synced;
  }

  /** 读取租户套餐 features（无套餐或空 features → {}） */
  async getTenantFeatures(tenantId: string): Promise<
    Record<string, number | string | boolean>
  > {
    const id = this.parseTenantPk(tenantId);
    const tenant = await this.tenantRepository.selectById(id);
    if (!tenant?.packageId) return {};
    const pkg = await this.prisma.sysTenantPackage.findFirst({
      where: { id: tenant.packageId },
    });
    const raw = pkg?.features;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, number | string | boolean>;
    }
    return {};
  }

  /**
   * 短信日发送上限（features.smsDailyLimit；未配置或 ≤0 不限）
   */
  async assertSmsDailyLimit(tenantId: string): Promise<void> {
    const features = await this.getTenantFeatures(tenantId);
    const limit = Number(features.smsDailyLimit ?? 0);
    if (!Number.isFinite(limit) || limit <= 0) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await TenantContext.run({ tenantId, ignore: false }, () =>
      this.prisma.sysSmsLog.count({
        where: { createTime: { gte: start } },
      }),
    );
    if (count >= limit) {
      throw new HttpException(
        TenantError.SMS_DAILY_LIMIT,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 文件存储配额：已落库文件 + 未完成上传预占；并发用租户锁。
   */
  async assertStorageQuota(tenantId: string, extraBytes: number): Promise<void> {
    const features = await this.getTenantFeatures(tenantId);
    const limitMb = Number(features.storageMb ?? 0);
    if (!Number.isFinite(limitMb) || limitMb <= 0) return;

    const used = await TenantContext.run({ tenantId, ignore: false }, async () => {
      const [files, reserved] = await Promise.all([
        this.prisma.sysFile.aggregate({ _sum: { size: true } }),
        this.prisma.sysFileUpload.aggregate({
          _sum: { size: true },
          where: { status: { in: ['init', 'uploading', 'merging'] } },
        }),
      ]);
      return (
        Number(files._sum.size ?? 0) + Number(reserved._sum.size ?? 0)
      );
    });
    if (used + Math.max(0, extraBytes) > limitMb * 1024 * 1024) {
      throw new HttpException(
        TenantError.STORAGE_LIMIT,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async withStorageQuotaLock<T>(
    tenantId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = `file:quota-lock:${tenantId}`;
    for (let i = 0; i < 40; i++) {
      const got = await this.redisService.setIfNotExists(key, '1', 15000);
      if (got) {
        try {
          return await fn();
        } finally {
          await this.redisService.delete(key);
        }
      }
      await new Promise((r) => setTimeout(r, 50 + i * 10));
    }
    throw new HttpException(TenantError.STORAGE_LIMIT, HttpStatus.CONFLICT);
  }

  /** 同账号最大会话数（features.maxSessions 或环境变量 MAX_SESSIONS_PER_USER；≤0 不限） */
  async getMaxSessions(tenantId: string): Promise<number> {
    const features = await this.getTenantFeatures(tenantId);
    const fromFeature = Number(features.maxSessions ?? NaN);
    if (Number.isFinite(fromFeature)) return fromFeature;
    const fromEnv = Number(process.env.MAX_SESSIONS_PER_USER ?? 0);
    return Number.isFinite(fromEnv) ? fromEnv : 0;
  }
}
