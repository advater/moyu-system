import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import {
  SKIP_AUTH_KEY,
  AUTH_WHITELIST,
  MUST_CHANGE_PASSWORD_WHITELIST,
} from '@/config/constants';
import { AuthError } from '@/config/error-messages';
import { OAuth2TokenService } from '@/modules/oauth2/oauth2Token/oauth2Token.service';
import { OAuth2AccessTokenDO } from '@/modules/oauth2/oauth2Token/entities/oauth2AccessToken.entity';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { extractWsAccessToken } from '@/utils/ws-token';
import { getAppConfig } from '@/config/file.config';

/**
 * JWT 认证守卫
 *
 * 令牌为「持久化令牌」：从数据库校验 accessToken 是否存在且未过期，
 * 再校验令牌主体（用户未被禁用、权限版本一致）与租户生命周期，
 * 校验通过后把登录用户信息挂载到 request.loginUser / request.user。
 */
@Injectable()
export class JwtGuard implements CanActivate, OnModuleInit {
  private whiteList: string[] = [];
  private apiPrefix = '';

  constructor(
    private reflector: Reflector,
    private readonly oauth2TokenService: OAuth2TokenService,
    private readonly tenantPolicyService: TenantPolicyService,
  ) {}

  onModuleInit() {
    this.whiteList = AUTH_WHITELIST;
    this.apiPrefix = String(getAppConfig().apiPrefix || '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isSkipAuth = this.reflector.getAllAndOverride<boolean>(
      SKIP_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isSkipAuth) return true;

    const protocol = context.getType();

    if (protocol === 'http') {
      const request = context.switchToHttp().getRequest<Request>();

      if (this.checkWhiteList(request.url)) return true;

      const token = this.extractToken(request);
      if (!token) {
        throw new UnauthorizedException(AuthError.INVALID_TOKEN);
      }

      const { tokenRecord, mustChangePassword } =
        await this.resolveHttpToken(token);

      // 被要求强制改密的用户，除改密相关接口外一律拒绝
      if (mustChangePassword && !this.isPasswordChangeAllowed(request.url)) {
        throw new ForbiddenException(AuthError.MUST_CHANGE_PASSWORD);
      }

      const loginUser: LoginUser = {
        id: tokenRecord.userId,
        userType: tokenRecord.userType,
        tenantId: tokenRecord.tenantId ?? '0',
        clientId: tokenRecord.clientId,
        scopes: (tokenRecord.scopes as string[]) ?? [],
        accessToken: token,
        userInfo: tokenRecord.userInfo as Record<string, string> | undefined,
      };
      (request as any).loginUser = loginUser;
      (request as any).user = loginUser;
      return true;
    }

    if (protocol === 'ws') {
      const client = context.switchToWs().getClient();
      const headers =
        client?.handshake?.headers ??
        client?.upgradeReq?.headers ??
        undefined;
      const url = client?.url ?? client?.handshake?.url;
      const authFromHandshake = client?.handshake?.auth?.token;
      const token =
        this.normalizeBearer(authFromHandshake) ||
        extractWsAccessToken(url, headers);
      if (!token) {
        throw new UnauthorizedException(AuthError.WS_MISSING_TOKEN);
      }
      const { tokenRecord } = await this.resolveHttpToken(token);
      const loginUser: LoginUser = {
        id: tokenRecord.userId,
        userType: tokenRecord.userType,
        tenantId: tokenRecord.tenantId ?? '0',
        clientId: tokenRecord.clientId,
        scopes: (tokenRecord.scopes as string[]) ?? [],
        accessToken: token,
      };
      if (client) {
        client.loginUser = loginUser;
      }
      return true;
    }

    // 未使用的协议默认拒绝，避免旁路
    throw new UnauthorizedException(AuthError.INVALID_TOKEN);
  }

  private checkWhiteList(url: string): boolean {
    return this.matchPathList(this.normalizePath(url), this.whiteList);
  }

  /** 强制改密期间仅放行「改密 / 用户信息 / 登出 / 换令牌」 */
  private isPasswordChangeAllowed(url: string): boolean {
    return this.matchPathList(
      this.normalizePath(url),
      MUST_CHANGE_PASSWORD_WHITELIST,
    );
  }

  /** 去掉全局 apiPrefix，得到供白名单匹配的路径 */
  private normalizePath(url: string): string {
    let normalized: string;
    try {
      normalized = new URL(url, 'http://localhost').pathname;
    } catch {
      normalized = url.split('?')[0] || url;
    }
    // 去掉全局前缀后再匹配，避免 /admin 导致白名单失效
    if (this.apiPrefix) {
      const prefixed = `/${this.apiPrefix}`;
      if (normalized === prefixed) {
        return '/';
      }
      if (normalized.startsWith(`${prefixed}/`)) {
        return normalized.slice(prefixed.length);
      }
    }
    return normalized;
  }

  private matchPathList(normalized: string, list: string[]): boolean {
    return list.some((path) => {
      if (path.endsWith('/')) return normalized.startsWith(path);
      return (
        normalized === path ||
        normalized.startsWith(`${path}/`) ||
        normalized.startsWith(`${path}?`)
      );
    });
  }

  /**
   * 校验访问令牌：存在 + 未过期 + 主体状态正常 + 租户可用
   *
   * @returns 令牌记录与「是否被要求强制改密」
   */
  private async resolveHttpToken(token: string): Promise<{
    tokenRecord: OAuth2AccessTokenDO;
    mustChangePassword: boolean;
  }> {
    const tokenRecord = await this.oauth2TokenService.findAccessToken(token);
    if (!tokenRecord) {
      throw new UnauthorizedException(AuthError.INVALID_TOKEN);
    }
    if (tokenRecord.expiresTime.getTime() <= Date.now()) {
      throw new UnauthorizedException(AuthError.TOKEN_EXPIRED);
    }
    // 令牌主体：用户被禁用 / 权限版本变更后旧令牌立即失效
    const subject = await this.oauth2TokenService.assertTokenSubject(
      tokenRecord,
    );
    // 租户生命周期：租户停用 / 过期后，存量令牌也不得继续访问
    await this.tenantPolicyService.assertTenantUsable(
      tokenRecord.tenantId ?? '0',
    );
    return {
      tokenRecord,
      mustChangePassword: subject.mustChangePassword,
    };
  }

  private extractToken(request: Request): string {
    let token = request.headers.authorization ?? '';
    token = this.normalizeBearer(token);
    if (!token && (request.cookies as Record<string, string>)?.authorization) {
      token = (request.cookies as Record<string, string>).authorization;
    }
    return token;
  }

  private normalizeBearer(raw?: string): string {
    if (!raw) return '';
    let token = String(raw).trim();
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    } else if (token.startsWith('Bearer')) {
      token = token.slice(6).trim();
    }
    return token;
  }
}
