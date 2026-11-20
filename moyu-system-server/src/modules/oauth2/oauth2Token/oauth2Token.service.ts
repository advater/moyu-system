import { Injectable, HttpException, HttpStatus, Optional } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import {
  OAuth2TokenPageReqDTO,
  OAuth2TokenResDTO,
} from './dto/oauth2Token.dto';
import { OAuth2AccessTokenDO } from './entities/oauth2AccessToken.entity';
import { OAuth2RefreshTokenDO } from './entities/oauth2RefreshToken.entity';
import { OAuth2TokenRepository } from './repositories/oauth2AccessToken.repository';
import { OAuth2RefreshTokenRepository } from './repositories/oauth2RefreshToken.repository';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import {
  AuthError,
  Oauth2Error,
  OpLogSub,
  OpLogType,
} from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { UserRepository } from '@/modules/user/user/repositories/user.repository';
import { OperateLogService } from '@/modules/logger/operateLog/operateLog.service';
import { CommonStatusEnum } from '@/config/constants';
import { pickTokensToRevoke } from './max-sessions.util';

/** 默认令牌有效期（秒） */
const DEFAULT_ACCESS_TOKEN_SECONDS = 15 * 60; // 15 分钟
const DEFAULT_REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60; // 7 天

/**
 * 密码变更与刷新令牌签发时间的比较宽限期（毫秒）
 *
 * password_update_time 由应用写入、令牌 create_time 由数据库写入，
 * 二者存在极小主机时钟偏差；留少量宽限，避免刚登录的会话被误判为改密前的旧会话。
 */
const PASSWORD_CHANGE_GRACE_MS = 5_000;

/**
 * 并发刷新宽限期（毫秒）
 *
 * 同一刷新令牌在此窗口内被重复使用（多标签页 / 重试并发刷新）视为噪声，
 * 不判定为泄露；超出窗口再次使用才按重放处理并吊销整个令牌家族。
 */
const REFRESH_REPLAY_GRACE_MS = 30_000;

/** 创建令牌的扩展参数 */
export interface CreateTokenOptions {
  tenantId?: string;
  /**
   * 刷新令牌家族编号：轮换时传入旧家族以延续令牌链，缺省则新建家族
   */
  familyId?: string;
  accessValiditySeconds?: number;
  refreshValiditySeconds?: number;
}

/** 令牌操作的请求来源（安全审计用，调用方未提供时留空） */
export interface TokenClientMeta {
  ip?: string;
  userAgent?: string;
}

/**
 * OAuth2 访问令牌管理 Service
 *
 * 负责访问令牌 / 刷新令牌的签发、刷新、校验与回收：
 * - 登录（auth.login / oauth2Open 各授权模式）→ createAccessToken
 * - 刷新（refresh-token / refresh_token 授权模式）→ refreshAccessToken
 * - 全局 JwtGuard 校验 → validateAccessToken
 * - 登出 / 撤销 → removeAccessToken
 */
@Injectable()
export class OAuth2TokenService {
  constructor(
    private readonly oauth2TokenRepository: OAuth2TokenRepository,
    private readonly oauth2RefreshTokenRepository: OAuth2RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly operateLogService: OperateLogService,
    @Optional() private readonly tenantPolicyService?: TenantPolicyService,
  ) {}

  /**
   * 按令牌字符串读写时跳过租户过滤（令牌全局唯一，行内自带 tenantId）
   */
  private async withTokenBypass<T>(fn: () => Promise<T>): Promise<T> {
    const prev = TenantContext.isIgnored();
    TenantContext.setIgnore(true);
    try {
      return await fn();
    } finally {
      TenantContext.setIgnore(prev);
    }
  }

  // ─── 令牌签发 ─────────────────────────────────────

  /**
   * 创建访问令牌（同时签发对应的刷新令牌并落库）
   *
   * @param userInfo 快照用户信息（nickname/avatar 等），冗余存储供令牌校验直接使用
   */
  async createAccessToken(
    userId: number,
    userType: number,
    clientId: string,
    userInfo?: Record<string, string>,
    scopes?: string[],
    options?: CreateTokenOptions,
  ): Promise<OAuth2AccessTokenDO> {
    const tenantId =
      options?.tenantId ??
      TenantContext.getTenantId() ??
      (() => {
        throw new HttpException(
          Oauth2Error.TOKEN_TENANT_MISSING,
          HttpStatus.BAD_REQUEST,
        );
      })();
    const accessSeconds =
      options?.accessValiditySeconds ?? DEFAULT_ACCESS_TOKEN_SECONDS;
    const refreshSeconds =
      options?.refreshValiditySeconds ?? DEFAULT_REFRESH_TOKEN_SECONDS;
    const now = new Date();

    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    // 家族编号：首次登录新建，刷新轮换时继承旧家族
    const familyId = options?.familyId ?? this.generateToken();

    return this.withTokenBypass(async () => {
      // 权限版本快照：记录签发时的用户 permVersion，供 JwtGuard 逐请求比对
      const permVersion =
        (await this.userRepository.selectPermVersionById(userId)) ?? 0;

      await this.oauth2RefreshTokenRepository.insert({
        tenantId,
        refreshToken,
        userId,
        userType,
        clientId,
        familyId,
        scopes: scopes?.length ? (scopes) : undefined,
        expiresTime: new Date(now.getTime() + refreshSeconds * 1000),
      });

      await this.oauth2TokenRepository.insert({
        tenantId,
        accessToken,
        refreshToken,
        userId,
        userType,
        clientId,
        scopes: scopes?.length ? (scopes) : undefined,
        userInfo: userInfo ? (userInfo) : undefined,
        permVersion,
        expiresTime: new Date(now.getTime() + accessSeconds * 1000),
      });

      await this.enforceMaxSessions(tenantId, userId, userType, accessToken);

      return (await this.oauth2TokenRepository.selectByAccessToken(
        accessToken,
      ))!;
    });
  }

  /** 超出最大会话数时吊销最旧令牌（保留刚签发的） */
  private async enforceMaxSessions(
    tenantId: string,
    userId: number,
    userType: number,
    keepAccessToken: string,
  ): Promise<void> {
    let max = Number(process.env.MAX_SESSIONS_PER_USER ?? 0);
    if (this.tenantPolicyService) {
      try {
        max = await this.tenantPolicyService.getMaxSessions(tenantId);
      } catch {
        /* ignore */
      }
    }
    if (!Number.isFinite(max) || max <= 0) return;

    const active = await this.oauth2TokenRepository.selectList({
      userId,
      userType,
      expiresTime: { gt: new Date() },
    });
    const toRevoke = pickTokensToRevoke(active, max, keepAccessToken);
    for (const t of toRevoke) {
      await this.oauth2RefreshTokenRepository.deleteByRefreshToken(
        t.refreshToken,
      );
      await this.oauth2TokenRepository.deleteByAccessToken(t.accessToken);
    }
  }

  /**
   * 读取有效的刷新令牌记录
   *
   * 查不到时区分两种情况：
   * - 该令牌曾签发但已被轮换 / 撤销 → 说明令牌被重复使用（可能已泄露），
   *   超出并发宽限期则吊销整个令牌家族并报专用错误码；
   * - 从未签发过 → 无效刷新令牌。
   *
   * 传入 expectedClientId 时校验令牌归属，避免他方客户端越权续期。
   */
  private async loadActiveRefreshToken(
    refreshToken: string,
    client?: TokenClientMeta,
    expectedClientId?: string,
  ): Promise<OAuth2RefreshTokenDO> {
    const record = await this.withTokenBypass(() =>
      this.oauth2RefreshTokenRepository.selectByRefreshToken(refreshToken),
    );
    if (record) {
      this.assertRefreshTokenOwner(record.clientId, expectedClientId);
      if (record.expiresTime.getTime() <= Date.now()) {
        throw new HttpException(
          AuthError.TOKEN_EXPIRED,
          HttpStatus.UNAUTHORIZED,
        );
      }
      await this.assertRefreshSubject(record);
      return record;
    }

    const rotated = await this.withTokenBypass(() =>
      this.oauth2RefreshTokenRepository.selectRevokedByRefreshToken(
        refreshToken,
      ),
    );
    if (rotated) {
      // 归属校验先于重放判定：他方客户端不得借重放逻辑吊销别人的令牌家族
      this.assertRefreshTokenOwner(rotated.clientId, expectedClientId);
    }
    if (!rotated) {
      throw new HttpException(
        AuthError.INVALID_RESET_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // 本身已过期的令牌（含定时任务清理）：按过期处理，不视为重放
    if (rotated.expiresTime.getTime() <= Date.now()) {
      throw new HttpException(
        AuthError.TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // 并发刷新（如多标签页同时刷新）会短暂重复使用同一令牌，不按泄露处理
    const rotatedAt = rotated.deletedAt?.getTime() ?? 0;
    if (Date.now() - rotatedAt <= REFRESH_REPLAY_GRACE_MS) {
      throw new HttpException(
        AuthError.INVALID_RESET_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const revoked = await this.revokeRefreshFamily(rotated.familyId);
    this.recordReplayAudit(rotated, revoked, client);
    throw new HttpException(
      AuthError.REFRESH_TOKEN_REPLAYED,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * 刷新前校验令牌归属：仅签发该刷新令牌的客户端可将其兑换为新令牌
   */
  private assertRefreshTokenOwner(
    clientId: string,
    expectedClientId?: string,
  ): void {
    if (expectedClientId && clientId !== expectedClientId) {
      throw new HttpException(
        Oauth2Error.TOKEN_CLIENT_MISMATCH,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * 刷新前校验令牌主体：用户存在、未被禁用、且密码自本令牌签发后未变更
   *
   * 改密 / 禁用会作废该用户既有会话：即使攻击者仍持有有效刷新令牌，
   * 也无法在凭据变更后继续续期。
   */
  private async assertRefreshSubject(
    record: OAuth2RefreshTokenDO,
  ): Promise<void> {
    const state = await this.withTokenBypass(() =>
      this.userRepository.selectAuthStateById(record.userId),
    );
    if (!state) {
      throw new HttpException(
        AuthError.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (state.status !== CommonStatusEnum.ENABLE) {
      throw new HttpException(
        AuthError.ACCOUNT_DISABLED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const passwordChangedAt = state.passwordUpdateTime?.getTime() ?? 0;
    if (
      passwordChangedAt >
      record.createTime.getTime() + PASSWORD_CHANGE_GRACE_MS
    ) {
      throw new HttpException(
        AuthError.CREDENTIAL_CHANGED,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * 吊销整条刷新令牌家族（重放侦测命中时调用）
   *
   * 家族内有效成员及其访问令牌一并回收，使泄露令牌的攻击者与当前会话同时失效。
   * @returns 被吊销的有效成员数
   */
  private async revokeRefreshFamily(familyId: string): Promise<number> {
    return this.withTokenBypass(async () => {
      const members =
        await this.oauth2RefreshTokenRepository.selectByFamilyId(familyId);
      for (const member of members) {
        await this.oauth2TokenRepository.deleteByRefreshToken(
          member.refreshToken,
        );
        await this.oauth2RefreshTokenRepository.deleteByRefreshToken(
          member.refreshToken,
        );
      }
      return members.length;
    });
  }

  /**
   * 写刷新令牌重放安全审计（操作日志）
   *
   * 记录令牌归属、家族编号、轮换时间与吊销成员数；写入失败不影响主流程。
   * 显式指定日志归属租户并跳过租户校验，避免刷新请求无租户上下文时写失败。
   */
  private recordReplayAudit(
    record: OAuth2RefreshTokenDO,
    revoked: number,
    client?: TokenClientMeta,
  ): void {
    const rotatedAt = record.deletedAt?.toISOString() ?? '';
    void this.withTokenBypass(() =>
      this.operateLogService.createOperateLog({
        traceId: randomUUID(),
        tenantId: record.tenantId,
        userId: record.userId,
        userType: record.userType,
        type: OpLogType.ONLINE_USER,
        subType: OpLogSub.REFRESH_TOKEN_REPLAY,
        action: `${OpLogSub.REFRESH_TOKEN_REPLAY}；familyId=${record.familyId}；revoked=${revoked}；rotatedAt=${rotatedAt}`,
        extra: JSON.stringify({
          familyId: record.familyId,
          clientId: record.clientId,
          rotatedAt,
          revoked,
          ip: client?.ip ?? '',
        }),
        userIp: (client?.ip ?? '').slice(0, 50),
        userAgent: (client?.userAgent ?? '').slice(0, 512),
      }),
    ).catch(() => undefined);
  }

  /**
   * 解析刷新令牌所属租户（校验存在且未过期，不签发新令牌）
   *
   * expectedClientId 用于服务间刷新场景的令牌归属校验。
   */
  async resolveRefreshTenantId(
    refreshToken: string,
    client?: TokenClientMeta,
    expectedClientId?: string,
  ): Promise<string> {
    const refreshRecord = await this.loadActiveRefreshToken(
      refreshToken,
      client,
      expectedClientId,
    );
    return refreshRecord.tenantId;
  }

  /**
   * 刷新访问令牌：轮换式刷新
   *
   * 校验刷新令牌未过期后作废旧令牌对，签发新令牌对并继承同一家族编号；
   * 旧刷新令牌随即失效，再次使用将被判定为重放（见 loadActiveRefreshToken）。
   * expectedClientId 传入时，仅令牌归属客户端可完成轮换。
   */
  async refreshAccessToken(
    refreshToken: string,
    options?: CreateTokenOptions,
    client?: TokenClientMeta,
    expectedClientId?: string,
  ): Promise<OAuth2AccessTokenDO> {
    const refreshRecord = await this.loadActiveRefreshToken(
      refreshToken,
      client,
      expectedClientId,
    );
    await this.withTokenBypass(async () => {
      await this.oauth2TokenRepository.deleteByRefreshToken(refreshToken);
      await this.oauth2RefreshTokenRepository.deleteByRefreshToken(refreshToken);
    });

    return this.createAccessToken(
      refreshRecord.userId,
      refreshRecord.userType,
      refreshRecord.clientId,
      undefined,
      refreshRecord.scopes,
      {
        tenantId: refreshRecord.tenantId,
        familyId: refreshRecord.familyId,
        ...options,
      },
    );
  }

  // ─── 令牌校验（供全局 JwtGuard 使用） ─────────────

  /**
   * 按 accessToken 查库（含已过期，不含软删）。供 JwtGuard 区分无效 / 过期。
   */
  async findAccessToken(
    accessToken: string,
  ): Promise<OAuth2AccessTokenDO | null> {
    return this.withTokenBypass(() =>
      this.oauth2TokenRepository.selectByAccessToken(accessToken),
    );
  }

  /**
   * 校验访问令牌是否有效：令牌存在 + 未过期
   */
  async validateAccessToken(
    accessToken: string,
  ): Promise<OAuth2AccessTokenDO | null> {
    const record = await this.findAccessToken(accessToken);
    if (!record) {
      return null;
    }
    if (record.expiresTime.getTime() <= Date.now()) {
      return null;
    }
    return record;
  }

  /**
   * 校验令牌主体的实时状态（供 JwtGuard 逐请求调用）
   *
   * - 用户不存在 / 已删除 → 令牌失效
   * - 用户被禁用 → 令牌立即失效（禁用无需等待令牌过期）
   * - 权限版本快照与当前不一致 → 赋权 / 角色变更后旧令牌失效
   *
   * 同时返回 mustChangePassword，供上层限制仅可访问改密相关接口。
   */
  async assertTokenSubject(
    record: OAuth2AccessTokenDO,
  ): Promise<{ mustChangePassword: boolean }> {
    const state = await this.withTokenBypass(() =>
      this.userRepository.selectAuthStateById(record.userId),
    );
    if (!state) {
      throw new HttpException(
        AuthError.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (state.status !== CommonStatusEnum.ENABLE) {
      throw new HttpException(
        AuthError.ACCOUNT_DISABLED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (state.permVersion !== record.permVersion) {
      throw new HttpException(
        AuthError.PERMISSION_VERSION_MISMATCH,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { mustChangePassword: state.mustChangePassword };
  }

  // ─── 令牌回收 ─────────────────────────────────────

  /**
   * 删除访问令牌（同时回收关联的刷新令牌）
   */
  async removeAccessToken(accessToken: string): Promise<boolean> {
    return this.withTokenBypass(async () => {
      const record =
        await this.oauth2TokenRepository.selectByAccessToken(accessToken);
      if (!record) {
        return false;
      }
      await this.oauth2RefreshTokenRepository.deleteByRefreshToken(
        record.refreshToken,
      );
      return this.oauth2TokenRepository.deleteByAccessToken(accessToken);
    });
  }

  // ─── 管理端：令牌分页 / 删除 ─────────────────────

  /** 分页查询访问令牌（只返回有效期内的；筛选条件均可选） */
  async getAccessTokenPage(
    req: OAuth2TokenPageReqDTO,
  ): Promise<PageResult<OAuth2TokenResDTO>> {
    const where: Record<string, unknown> = {
      expiresTime: { gt: new Date() },
    };
    if (req.userId !== undefined && req.userId !== null) {
      where.userId = req.userId;
    }
    if (req.userType !== undefined && req.userType !== null) {
      where.userType = req.userType;
    }
    if (req.clientId) {
      where.clientId = req.clientId;
    }
    const { page, pageSize } = req;
    const result = await this.oauth2TokenRepository.selectPage(
      { page, pageSize },
      where,
    );
    return {
      list: result.list.map((item) => this.toResDTO(item)),
      total: result.total,
    };
  }

  /** 删除指定访问令牌 */
  async deleteAccessToken(accessToken: string): Promise<boolean> {
    return this.withTokenBypass(async () => {
      const record =
        await this.oauth2TokenRepository.selectByAccessToken(accessToken);
      if (!record) {
        throw new HttpException(
          Oauth2Error.TOKEN_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      await this.oauth2RefreshTokenRepository.deleteByRefreshToken(
        record.refreshToken,
      );
      return this.oauth2TokenRepository.deleteByAccessToken(accessToken);
    });
  }

  /** 批量删除访问令牌 */
  async deleteAccessTokenList(accessTokens: string[]): Promise<boolean> {
    return this.withTokenBypass(() =>
      this.oauth2TokenRepository.deleteByAccessTokens(accessTokens),
    );
  }

  /**
   * 在线用户（有效期内访问令牌分页；过滤条件均可选）
   */
  async getOnlineUserPage(req: {
    page: number;
    pageSize: number;
    userId?: number;
    userType?: number;
    clientId?: string;
  }): Promise<PageResult<OAuth2TokenResDTO>> {
    const where: Record<string, unknown> = {
      expiresTime: { gt: new Date() },
    };
    if (req.userId !== undefined && req.userId !== null) where.userId = req.userId;
    if (req.userType !== undefined && req.userType !== null) {
      where.userType = req.userType;
    }
    if (req.clientId) where.clientId = req.clientId;
    const result = await this.oauth2TokenRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return {
      list: result.list.map((item) => this.toResDTO(item)),
      total: result.total,
    };
  }

  /** 强制下线：按用户吊销全部有效 access + 关联 refresh */
  async forceLogoutByUserId(
    userId: number,
    userType?: number,
  ): Promise<{ revoked: number }> {
    return this.withTokenBypass(async () => {
      const { count, refreshTokens } =
        await this.oauth2TokenRepository.deleteByUserId(userId, userType);
      for (const rt of refreshTokens) {
        await this.oauth2RefreshTokenRepository.deleteByRefreshToken(rt);
      }
      return { revoked: count };
    });
  }

  // ─── 私有方法 ─────────────────────────────────────

  /** 生成随机令牌（64 位十六进制字符串） */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /** 访问令牌 DO → ResDTO */
  private toResDTO(item: OAuth2AccessTokenDO): OAuth2TokenResDTO {
    const vo = new OAuth2TokenResDTO();
    vo.id = item.id;
    vo.accessToken = item.accessToken;
    vo.refreshToken = item.refreshToken;
    vo.userId = item.userId;
    vo.userType = item.userType;
    vo.clientId = item.clientId;
    vo.createTime = formatDate(item.createTime);
    vo.expiresTime = formatDate(item.expiresTime);
    return vo;
  }
}
