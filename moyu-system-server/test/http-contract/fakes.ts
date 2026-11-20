import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CommonStatusEnum } from '@/config/constants';
import { AuthError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { OAuth2AccessTokenDO } from '@/modules/oauth2/oauth2Token/entities/oauth2AccessToken.entity';
import { pickTokensToRevoke } from '@/modules/oauth2/oauth2Token/max-sessions.util';
import { httpContractWorld, type MemToken } from './world';

@Injectable()
export class HttpContractTokenService {
  async findAccessToken(accessToken: string): Promise<OAuth2AccessTokenDO | null> {
    const rec = httpContractWorld.tokens.get(accessToken);
    if (!rec || rec.deleted) return null;
    return rec;
  }

  async validateAccessToken(
    accessToken: string,
  ): Promise<OAuth2AccessTokenDO | null> {
    const record = await this.findAccessToken(accessToken);
    if (!record) return null;
    if (record.expiresTime.getTime() <= Date.now()) return null;
    return record;
  }

  async assertTokenSubject(
    record: OAuth2AccessTokenDO,
  ): Promise<{ mustChangePassword: boolean }> {
    const user = httpContractWorld.user(record.userId);
    if (!user) {
      throw new HttpException(AuthError.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }
    if (user.status !== CommonStatusEnum.ENABLE) {
      throw new HttpException(
        AuthError.ACCOUNT_DISABLED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.permVersion !== record.permVersion) {
      throw new HttpException(
        AuthError.PERMISSION_VERSION_MISMATCH,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { mustChangePassword: user.mustChangePassword };
  }

  async forceLogoutByUserId(
    userId: number,
    _userType?: number,
  ): Promise<{ revoked: number }> {
    let count = 0;
    for (const rec of httpContractWorld.tokens.values()) {
      if (rec.userId === userId && !rec.deleted) {
        rec.deleted = true;
        count += 1;
      }
    }
    return { revoked: count };
  }

  issue(userId: number, createTime = new Date()): MemToken {
    const user = httpContractWorld.user(userId);
    if (!user) {
      throw new Error(`unknown user ${userId}`);
    }
    const accessToken = randomBytes(16).toString('hex');
    const rec: MemToken = {
      id: httpContractWorld.tokenSeq++,
      accessToken,
      refreshToken: `${accessToken}-rt`,
      userId,
      userType: 1,
      tenantId: user.tenantId,
      clientId: 'default',
      scopes: [],
      userInfo: {},
      permVersion: user.permVersion,
      expiresTime: new Date(Date.now() + 60 * 60 * 1000),
      createTime,
      updateTime: createTime,
      creator: String(userId),
      updater: String(userId),
      deleted: false,
    };
    httpContractWorld.tokens.set(accessToken, rec);

    const active = [...httpContractWorld.tokens.values()].filter(
      (t) =>
        t.userId === userId &&
        !t.deleted &&
        t.expiresTime.getTime() > Date.now(),
    );
    const toRevoke = pickTokensToRevoke(
      active,
      httpContractWorld.maxSessions,
      accessToken,
    );
    for (const t of toRevoke) {
      t.deleted = true;
    }
    return rec;
  }
}

@Injectable()
export class HttpContractTenantPolicyService {
  async assertTenantUsable(_tenantId: string): Promise<void> {
    return;
  }

  async getMaxSessions(_tenantId: string): Promise<number> {
    return httpContractWorld.maxSessions;
  }
}

@Injectable()
export class HttpContractPermissionService {
  async getUserAccessBundle(userId: number) {
    const user = httpContractWorld.user(userId);
    return {
      roles: user?.roles ?? [],
      permissions: user?.permissions ?? [],
    };
  }
}

@Injectable()
export class HttpContractOperateLogService {
  async createOperateLog(_row: unknown): Promise<void> {
    return;
  }
}

@Injectable()
export class HttpContractLoggerService {
  error(_payload?: unknown): void {
    return;
  }
  log(_payload?: unknown): void {
    return;
  }
  warn(_payload?: unknown): void {
    return;
  }
}

function currentTenant(): string | null {
  return TenantContext.getTenantId();
}

export const memoryUserRoleRepository = {
  async selectRoleIdsByUserId(userId: number): Promise<number[]> {
    return httpContractWorld.user(userId)?.roleIds ?? [];
  },
};

export const memoryRoleRepository = {
  async selectByIds(ids: number[]) {
    return httpContractWorld.roles
      .filter((r) => ids.includes(r.id))
      .map((r) => httpContractWorld.toRoleDO(r));
  },
};

export const memoryUserRepository = {
  async selectById(id: number) {
    const tenantId = currentTenant();
    const user = httpContractWorld.user(id);
    if (!user) return null;
    if (tenantId && user.tenantId !== tenantId) return null;
    return user;
  },
  async selectAuthStateById(id: number) {
    const user = httpContractWorld.user(id);
    if (!user) return null;
    return {
      status: user.status,
      permVersion: user.permVersion,
      mustChangePassword: user.mustChangePassword,
      passwordUpdateTime: null,
    };
  },
};

export const memoryDeptRepository = {
  async selectById(id: number) {
    const tenantId = currentTenant();
    const dept = httpContractWorld.depts.find((d) => d.id === id && !d.deleted);
    if (!dept) return null;
    if (tenantId && dept.tenantId !== tenantId) return null;
    return dept;
  },
  async selectByUnique(where: { parentId?: number; name?: string }) {
    const tenantId = currentTenant();
    return (
      httpContractWorld.depts.find((d) => {
        if (d.deleted) return false;
        if (tenantId && d.tenantId !== tenantId) return false;
        if (where.parentId !== undefined && d.parentId !== where.parentId) {
          return false;
        }
        if (where.name !== undefined && d.name !== where.name) return false;
        return true;
      }) ?? null
    );
  },
  async selectList() {
    const tenantId = currentTenant();
    return httpContractWorld.depts.filter(
      (d) => !d.deleted && (!tenantId || d.tenantId === tenantId),
    );
  },
  async deleteById(id: number) {
    const dept = await this.selectById(id);
    if (!dept) return false;
    dept.deleted = true;
    return true;
  },
};

export const memoryPrisma = {
  sysUser: {
    async count({ where }: { where: { deptId: number } }) {
      const tenantId = currentTenant();
      return httpContractWorld.users.filter((u) => {
        if (u.deptId !== where.deptId) return false;
        if (tenantId && u.tenantId !== tenantId) return false;
        return true;
      }).length;
    },
  },
  sysRole: {
    async findMany() {
      return httpContractWorld.roles.map((r) => ({
        id: r.id,
        dataScopeDeptIds: r.dataScopeDeptIds,
      }));
    },
  },
};
