import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import {
  OAuth2OpenAccessTokenResDTO,
  OAuth2OpenAuthorizeInfoResDTO,
  OAuth2OpenCheckTokenResDTO,
} from './dto/oauth2Open.dto';
import { OAuth2CodeRepository } from './repositories/oauth2Code.repository';
import { OAuth2ApproveRepository } from './repositories/oauth2Approve.repository';
import { OAuth2ClientService } from '@/modules/oauth2/oauth2Client/oauth2Client.service';
import {
  OAuth2TokenService,
  type TokenClientMeta,
} from '@/modules/oauth2/oauth2Token/oauth2Token.service';
import { OAuth2ClientDO } from '@/modules/oauth2/oauth2Client/entities/oauth2Client.entity';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { AuthError, Oauth2Error } from '@/config/error-messages';
import { UserRepository } from '@/modules/user/user/repositories/user.repository';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import { TenantContext } from '@/common/tenant/tenant.context';
import { toPlainString } from '@/utils/to-plain-string';

/** 授权码有效期：10 分钟 */
const AUTHORIZE_CODE_TTL = 10 * 60 * 1000;
/** 用户授权记录有效期：30 天 */
const APPROVE_TTL = 30 * 24 * 60 * 60 * 1000;
/** 支持授权的响应类型 */
const RESPONSE_TYPES = ['code'];
/** 令牌类型 */
const TOKEN_TYPE = 'bearer';

/** 恒定时间字符串比较：长度不等直接判否，避免通过响应时间试探密钥 */
function safeEqualSecret(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * OAuth2 授权 Service
 *
 * 实现「第三方客户端」接入所需的授权端点：
 * - GET  /authorize  ：返回授权页所需的客户端信息 + scope 勾选状态
 * - POST /authorize  ：用户「同意/拒绝」后，发放 code（授权码模式）或直接下发 token（简化模式）
 * - POST /token      ：使用 code（授权码模式）/ refresh_token（刷新）换取访问令牌
 * - POST /check-token：令牌校验（资源服务器验票）
 * - DELETE /token    ：令牌撤销
 *
 * 账号密码型（password）授权：由本系统的 /auth/login 等登录接口承担，
 * 不在此开放端点暴露（避免引入验证码 / 登录日志等内部逻辑）。
 */
@Injectable()
export class OAuth2OpenService {
  constructor(
    private readonly oauth2ClientService: OAuth2ClientService,
    private readonly oauth2TokenService: OAuth2TokenService,
    private readonly oauth2CodeRepository: OAuth2CodeRepository,
    private readonly oauth2ApproveRepository: OAuth2ApproveRepository,
    private readonly userRepository: UserRepository,
  ) {}

  // ─── Token 端点 ─────────────────────────────────────

  /**
   * 获得访问令牌
   *
   * 客户端身份通过 HTTP Basic（Authorization: Basic base64(clientId:secret)）认证，
   * 支持授权码模式与刷新令牌模式。
   */
  async postAccessToken(
    req: Partial<{
      grantType: string;
      code: string;
      redirectUri: string;
      state: string;
      scope: string;
      refreshToken: string;
    }>,
    authorization?: string,
    clientMeta?: TokenClientMeta,
  ): Promise<OAuth2OpenAccessTokenResDTO> {
    // 1. 校验授权类型
    const grantType = req.grantType;
    if (!['authorization_code', 'refresh_token'].includes(grantType ?? '')) {
      throw new HttpException(
        Oauth2Error.GRANT_TYPE_UNSUPPORTED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 2. 校验客户端（clientId:secret）
    const client = await this.authenticateClient(authorization);

    // 3. 根据授权模式获取访问令牌
    if (grantType === 'refresh_token') {
      return this.grantByRefreshToken(client, req.refreshToken, clientMeta);
    }
    return this.grantByCode(client, req.code, req.redirectUri);
  }

  /** 删除访问令牌（撤销） */
  async revokeToken(token: string, authorization?: string): Promise<boolean> {
    const client = await this.authenticateClient(authorization);
    if (!token) {
      return false;
    }
    const record = await this.oauth2TokenService.findAccessToken(token);
    if (!record) {
      return false;
    }
    this.assertTokenOwner(record.clientId, client.clientId);
    return this.oauth2TokenService.removeAccessToken(token);
  }

  /** 校验访问令牌 */
  async checkToken(
    token: string,
    authorization?: string,
  ): Promise<OAuth2OpenCheckTokenResDTO> {
    const client = await this.authenticateClient(authorization);
    const tokenRecord = await this.oauth2TokenService.validateAccessToken(token);
    if (!tokenRecord) {
      throw new HttpException(
        AuthError.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // 仅签发方客户端可内省令牌，避免任意注册客户端窥探他人令牌信息
    this.assertTokenOwner(tokenRecord.clientId, client.clientId);
    const resp = new OAuth2OpenCheckTokenResDTO();
    resp.userId = tokenRecord.userId;
    resp.userType = tokenRecord.userType;
    resp.tenantId = Number(tokenRecord.tenantId ?? '0');
    resp.clientId = tokenRecord.clientId;
    resp.scopes = (tokenRecord.scopes) ?? [];
    resp.accessToken = token;
    resp.exp = Math.round(tokenRecord.expiresTime.getTime() / 1000);
    return resp;
  }

  // ─── 授权端点 ───────────────────────────────────────

  /**
   * 获得授权信息（授权页渲染数据）
   *
   * 展示客户端名称 / 图标，以及 scope 勾选状态（历史授权过的默认勾选）。
   */
  async authorize(
    clientId: string,
    loginUser: LoginUser,
  ): Promise<OAuth2OpenAuthorizeInfoResDTO> {
    const client = await this.getClient(clientId);
    const resp = new OAuth2OpenAuthorizeInfoResDTO();
    resp.client = { name: client.name, logo: client.logo ?? '' };

    // 已批准的 scope（approved + 未过期）
    const approvedScopes = new Set<string>();
    const approves = await this.oauth2ApproveRepository.selectList({
      userId: loginUser.id,
      userType: loginUser.userType,
      clientId,
    });
    const now = Date.now();
    approves.forEach((approve) => {
      if (approve.approved && approve.expiresTime.getTime() > now) {
        approvedScopes.add(approve.scope);
      }
    });

    resp.scopes = ((client.scopes) ?? []).map(
      (scope) => ({
        key: scope,
        value: approvedScopes.has(scope),
      }),
    );
    return resp;
  }

  /**
   * 申请授权（用户同意 / 拒绝）
   *
   * - autoApprove=true  （同意）：记录授权批准，按 responseType 发放 code 或直接下发 token
   * - autoApprove=false （拒绝）：记录拒绝后，跳转错误链接
   * 返回值为重定向 URL（含 code / token 或错误信息）。
   */
  async approveOrDeny(
    req: Partial<{
      responseType: string;
      clientId: string;
      scope: string;
      redirectUri: string;
      autoApprove: boolean;
      state: string;
    }>,
    loginUser: LoginUser,
  ): Promise<string> {
    // 1. 基础校验
    const responseType = req.responseType;
    if (!RESPONSE_TYPES.includes(responseType ?? '')) {
      throw new HttpException(
        Oauth2Error.RESPONSE_TYPE_CODE_ONLY,
        HttpStatus.BAD_REQUEST,
      );
    }
    const client = await this.getClient(req.clientId ?? '');
    this.checkRedirectUri(client, req.redirectUri);
    const scopes = this.parseScope(req.scope);
    this.checkScopes(client, scopes);

    // 2. 记录每个 scope 的授权结果（同意/拒绝）
    const approveTime = new Date(Date.now() + APPROVE_TTL);
    for (const scope of scopes) {
      await this.oauth2ApproveRepository.upsert({
        userId: loginUser.id,
        userType: loginUser.userType,
        clientId: client.clientId,
        scope,
        approved: req.autoApprove === true,
        expiresTime: approveTime,
      });
    }

    // 3. 用户拒绝 → 跳转错误链接
    if (req.autoApprove !== true) {
      return this.buildRedirect(
        req.redirectUri!,
        { error: 'access_denied', error_description: '用户拒绝了授权请求' },
        req.state,
      );
    }

    // 4. code 授权码模式
    if (responseType === 'code') {
      const code = this.generateCode();
      await this.oauth2CodeRepository.insert({
        code,
        userId: loginUser.id,
        userType: loginUser.userType,
        clientId: client.clientId,
        scopes: scopes,
        redirectUri: req.redirectUri!,
        state: req.state ?? null,
        expiresTime: new Date(Date.now() + AUTHORIZE_CODE_TTL),
      });
      return this.buildRedirect(req.redirectUri!, { code }, req.state);
    }

    throw new HttpException(
      Oauth2Error.RESPONSE_TYPE_CODE_ONLY,
      HttpStatus.BAD_REQUEST,
    );
  }

  // ─── 私有方法 ───────────────────────────────────────

  /** 授权码模式：code 换取访问令牌（code 一次性） */
  private async grantByCode(
    client: OAuth2ClientDO,
    code?: string,
    redirectUri?: string,
  ): Promise<OAuth2OpenAccessTokenResDTO> {
    if (!code) {
      throw new HttpException(
        Oauth2Error.INVALID_CODE,
        HttpStatus.BAD_REQUEST,
      );
    }
    const codeRecord = await this.oauth2CodeRepository.selectByCode(code);
    if (!codeRecord) {
      throw new HttpException(
        Oauth2Error.INVALID_CODE,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 客户端与授权码不匹配 / redirectUri 不一致视为无效
    if (
      codeRecord.clientId !== client.clientId ||
      (redirectUri && codeRecord.redirectUri !== redirectUri)
    ) {
      throw new HttpException(
        Oauth2Error.INVALID_CODE,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (codeRecord.expiresTime.getTime() <= Date.now()) {
      throw new HttpException(
        Oauth2Error.CODE_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 一次性使用：立即作废
    await this.oauth2CodeRepository.deleteByCode(code);

    const tokenRecord = await this.oauth2TokenService.createAccessToken(
      codeRecord.userId,
      codeRecord.userType,
      codeRecord.clientId,
      undefined,
      (codeRecord.scopes) ?? [],
      {
        tenantId: await this.resolveUserTenantId(codeRecord.userId),
        accessValiditySeconds: client.accessTokenValiditySeconds,
        refreshValiditySeconds: client.refreshTokenValiditySeconds,
      },
    );
    return this.toTokenResDTO(tokenRecord);
  }

  /** 刷新令牌模式：刷新访问令牌 */
  private async grantByRefreshToken(
    client: OAuth2ClientDO,
    refreshToken?: string,
    clientMeta?: TokenClientMeta,
  ): Promise<OAuth2OpenAccessTokenResDTO> {
    if (!refreshToken) {
      throw new HttpException(
        AuthError.INVALID_RESET_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const tokenRecord = await this.oauth2TokenService.refreshAccessToken(
      refreshToken,
      {
        accessValiditySeconds: client.accessTokenValiditySeconds,
        refreshValiditySeconds: client.refreshTokenValiditySeconds,
      },
      clientMeta,
      // 仅签发该刷新令牌的客户端可续期
      client.clientId,
    );
    return this.toTokenResDTO(tokenRecord);
  }

  /** 令牌归属校验：仅签发令牌的客户端可内省 / 撤销 */
  private assertTokenOwner(
    tokenClientId: string,
    callerClientId: string,
  ): void {
    if (tokenClientId !== callerClientId) {
      throw new HttpException(
        Oauth2Error.TOKEN_CLIENT_MISMATCH,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /** 令牌 DO → 开放接口令牌 DTO */
  private toTokenResDTO(
    tokenRecord: {
      accessToken: string;
      refreshToken: string;
      expiresTime: Date;
      scopes?: unknown;
    },
  ): OAuth2OpenAccessTokenResDTO {
    const resp = new OAuth2OpenAccessTokenResDTO();
    resp.accessToken = tokenRecord.accessToken;
    resp.refreshToken = tokenRecord.refreshToken;
    resp.tokenType = TOKEN_TYPE;
    resp.expiresIn = Math.max(
      0,
      Math.round((tokenRecord.expiresTime.getTime() - Date.now()) / 1000),
    );
    const scopes = (tokenRecord.scopes as string[]) ?? [];
    resp.scope = scopes.length ? scopes.join(' ') : undefined;
    return resp;
  }

  /** 客户端身份认证（HTTP Basic：base64(clientId:secret)） */
  private async authenticateClient(
    authorization?: string,
  ): Promise<OAuth2ClientDO> {
    let clientId = '';
    let secret = '';
    if (authorization && authorization.startsWith('Basic ')) {
      try {
        const decoded = Buffer.from(
          authorization.slice(6).trim(),
          'base64',
        ).toString('utf-8');
        const idx = decoded.indexOf(':');
        if (idx > -1) {
          clientId = decoded.slice(0, idx);
          secret = decoded.slice(idx + 1);
        }
      } catch {
        // base64 解析失败走下方统一异常
      }
    }
    if (!clientId) {
      throw new HttpException(
        Oauth2Error.INVALID_CLIENT,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // 客户端需存在、启用，且密钥匹配（恒定时间比较）
    const client = await this.getClient(clientId);
    if (!safeEqualSecret(client.secret ?? '', secret)) {
      throw new HttpException(
        Oauth2Error.INVALID_CLIENT,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return client;
  }

  /** 客户端基础校验（供 authorize 场景使用，无需密钥） */
  private async getClient(clientId: string): Promise<OAuth2ClientDO> {
    if (!clientId) {
      throw new HttpException(
        Oauth2Error.CLIENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    const client =
      await this.oauth2ClientService.getOAuth2ClientByClientId(clientId);
    if (!client) {
      throw new HttpException(
        Oauth2Error.CLIENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (client.status !== 1) {
      throw new HttpException(
        Oauth2Error.CLIENT_DISABLED,
        HttpStatus.BAD_REQUEST,
      );
    }
    return client;
  }

  /** 校验 redirectUri 属于客户端配置的重定向地址 */
  private checkRedirectUri(
    client: OAuth2ClientDO,
    redirectUri?: string,
  ): void {
    const allowed = (client.redirectUris) ?? [];
    if (!redirectUri || !allowed.includes(redirectUri)) {
      throw new HttpException(
        Oauth2Error.REDIRECT_URI_NOT_REGISTERED,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** 校验 scope 均在客户端授权范围内 */
  private checkScopes(client: OAuth2ClientDO, scopes: string[]): void {
    if (scopes.length === 0) {
      throw new HttpException(Oauth2Error.SCOPE_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const allowed = new Set(
      (client.scopes) ?? [],
    );
    const invalid = scopes.find((scope) => !allowed.has(scope));
    if (invalid) {
      throw new HttpException(
        `授权范围 ${invalid} 不在客户端允许范围内`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** 解析 scope（支持空格 / 逗号分隔） */
  private parseScope(scope?: string): string[] {
    if (!scope) {
      return [];
    }
    return scope
      .split(/[\s,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  /** 按用户编号解析租户（授权码换 token 时无登录态） */
  private async resolveUserTenantId(userId: number): Promise<string> {
    // 无租户上下文时 Prisma 不注入隔离，可按 id 直查
    const prevIgnore = TenantContext.isIgnored();
    TenantContext.setIgnore(true);
    try {
      const user = await this.userRepository.selectById(userId);
      return user?.tenantId ?? DEFAULT_TENANT_ID;
    } finally {
      TenantContext.setIgnore(prevIgnore);
    }
  }

  /** 生成授权码（32 位十六进制字符串） */
  private generateCode(): string {
    return randomBytes(16).toString('hex');
  }

  /** 拼接重定向 URL（code / token 追加到 query，token 模式下追加到 fragment） */
  private buildRedirect(
    redirectUri: string,
    params: Record<string, unknown>,
    state?: string,
    fragment = false,
  ): string {
    const url = new URL(redirectUri);
    const target = fragment ? url.hash : url.search;
    const paramsObj = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean' &&
        typeof value !== 'bigint'
      ) {
        return;
      }
      paramsObj.set(key, toPlainString(value));
    });
    if (state) {
      paramsObj.set('state', state);
    }
    const joined = paramsObj.toString();
    if (!joined) {
      return redirectUri;
    }
    if (fragment) {
      url.hash = (target ? target.slice(1) + '&' : '') + joined;
    } else {
      url.search = (target ? target.slice(1) + '&' : '') + joined;
    }
    return url.toString();
  }
}
