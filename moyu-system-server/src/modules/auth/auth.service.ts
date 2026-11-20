import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { UserRepository } from '@/modules/user/user/repositories/user.repository';
import { UserPasswordService } from '@/modules/user/user/user-password.service';
import { UserDO } from '@/modules/user/user/entities/user.entity';
import { UserProfileRepository } from '@/modules/user/userProfile/repositories/userProfile.repository';
import { UserRoleRepository } from '@/modules/permission/role/repositories/userRole.repository';
import { RoleRepository } from '@/modules/permission/role/repositories/role.repository';
import { RoleMenuRepository } from '@/modules/permission/role/repositories/roleMenu.repository';
import { MenuRepository } from '@/modules/permission/menu/repositories/menu.repository';
import { MenuDO } from '@/modules/permission/menu/entities/menu.entity';
import { OAuth2TokenService } from '@/modules/oauth2/oauth2Token/oauth2Token.service';
import { OAuth2AccessTokenDO } from '@/modules/oauth2/oauth2Token/entities/oauth2AccessToken.entity';
import { LoginLogService } from '@/modules/logger/loginLog/loginLog.service';
import { SmsCallbackService } from '@/modules/sms/smsCallback/smsCallback.service';
import { SocialClientRepository } from '@/modules/social/socialClient/repositories/socialClient.repository';
import { SocialUserService } from '@/modules/social/socialUser/socialUser.service';
import { buildSocialAuthorizeUrl } from '@/modules/social/social-oauth';
import { CaptchaService } from '@/modules/captcha/captcha.service';
import { RedisService } from '@/plugins/redis/redis.service';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { IpService } from '@/modules/ip/ip.service';

/** 客户端元信息（IP / UA），用于登录日志 */
export interface AuthClientMeta {
  ip?: string;
  userAgent?: string;
}

import { comparePwd, hashPassword } from '@/utils/password';
import {
  OAUTH2_DEFAULT_CLIENT_ID,
  OAUTH2_DEFAULT_SCOPE,
  USER_TYPE_ADMIN,
  DEFAULT_TENANT_ID,
  MAX_LOGIN_ATTEMPTS,
  LOCK_DURATION_MINUTES,
  LOGIN_FAIL_PREFIX,
  PASSWORD_EXPIRE_DAYS,
  SOCIAL_OAUTH_STATE_PREFIX,
  SOCIAL_OAUTH_STATE_EXPIRE,
} from '@/config/constants';
import { isSuperAdmin } from '@/utils/super-admin';
import {
  AuthError,
  SocialError,
  UserError,
  TenantError,
} from '@/config/error-messages';
import { i18nKey } from '@/i18n';
import { TenantContext } from '@/common/tenant/tenant.context';
import { isPasswordExpired } from '@/utils/password-expire';
import { assertSocialRedirectAllowed } from '@/utils/social-redirect';
import { randomUUID } from 'node:crypto';
import {
  AuthLoginReqDTO,
  AuthLoginResDTO,
  AuthMenuResDTO,
  AuthPermissionInfoResDTO,
  AuthRegisterReqDTO,
  AuthResetPasswordReqDTO,
  AuthSmsLoginReqDTO,
  AuthSmsSendReqDTO,
  AuthSocialLoginReqDTO,
  AuthUserResDTO,
} from './dto/auth.dto';
import { TenantRepository } from '@/modules/tenant/tenant/repositories/tenant.repository';

/**
 * 认证管理 Service
 *
 * 负责管理后台用户的：
 * - 登录 / 登出 / 刷新令牌（令牌为 DB 持久化令牌，见 oauth2Token 模块）
 * - 登录用户权限信息（角色 / 操作权限 / 菜单树）组装
 * - 账号注册、短信验证码发送 / 登录 / 找回密码
 * - 社交授权跳转与快捷登录（依赖已配置的社交客户端 + 绑定关系）
 */
@Injectable()
export class AuthService {
  /** 短信验证码 scene：登录（与前端 send-sms-code 约定一致） */
  private readonly SMS_SCENE_LOGIN = 1;
  /** 短信验证码 scene：找回密码（与前端 send-sms-code 约定一致） */
  private readonly SMS_SCENE_RESET_PASSWORD = 3;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly menuRepository: MenuRepository,
    private readonly oauth2TokenService: OAuth2TokenService,
    private readonly loginLogService: LoginLogService,
    private readonly smsCallbackService: SmsCallbackService,
    private readonly socialClientRepository: SocialClientRepository,
    private readonly socialUserService: SocialUserService,
    private readonly captchaService: CaptchaService,
    private readonly redisService: RedisService,
    private readonly tenantPolicyService: TenantPolicyService,
    private readonly tenantRepository: TenantRepository,
    private readonly ipService: IpService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  /** 解析当前请求租户：body.tenantId > body.tenantName > ALS(header) > 默认租户 */
  private async resolveTenantId(
    explicit?: string,
    tenantName?: string,
  ): Promise<string> {
    let id = explicit?.trim() || '';
    if (!id && tenantName?.trim()) {
      const tenant = await this.tenantRepository.selectByUnique({
        name: tenantName.trim(),
      });
      if (!tenant) {
        throw new HttpException(
          TenantError.NOT_EXIST_CONTACT_ADMIN,
          HttpStatus.NOT_FOUND,
        );
      }
      id = String(tenant.id);
    }
    if (!id) {
      id = TenantContext.getTenantId() || DEFAULT_TENANT_ID;
    }
    TenantContext.setTenantId(id);
    return id;
  }

  /** 是否强制图形验证码（生产默认开；开发默认关；AUTH_CAPTCHA_ENABLED 可覆盖） */
  private isCaptchaEnabled(): boolean {
    const raw = process.env.AUTH_CAPTCHA_ENABLED;
    if (raw === undefined || raw === '') {
      return process.env.NODE_ENV === 'production';
    }
    return raw !== 'false' && raw !== '0';
  }

  /** 是否允许开放注册（默认关闭；AUTH_REGISTER_ENABLED=true 开启） */
  private isRegisterEnabled(): boolean {
    const raw = process.env.AUTH_REGISTER_ENABLED;
    return raw === 'true' || raw === '1';
  }

  /** 是否启用密码过期（默认开启；AUTH_PASSWORD_EXPIRE_ENABLED=false 可关闭） */
  private isPasswordExpireEnabled(): boolean {
    const raw = process.env.AUTH_PASSWORD_EXPIRE_ENABLED;
    if (raw === undefined || raw === '') return true;
    return raw !== 'false' && raw !== '0';
  }

  private loginFailKey(tenantId: string, username: string): string {
    return `${LOGIN_FAIL_PREFIX}:${tenantId}:${username.toLowerCase()}`;
  }

  /** 校验账号是否因失败次数过多被锁定 */
  private async assertNotLocked(
    tenantId: string,
    username: string,
  ): Promise<void> {
    const key = this.loginFailKey(tenantId, username);
    const fails = Number(
      (await this.redisService.get<number | string>(key)) ?? 0,
    );
    if (fails >= MAX_LOGIN_ATTEMPTS) {
      const ttlMs = await this.redisService.pttl(key);
      const minutes =
        ttlMs > 0
          ? Math.max(1, Math.ceil(ttlMs / 60_000))
          : LOCK_DURATION_MINUTES;
      throw new HttpException(
        i18nKey(AuthError.ACCOUNT_LOCKED, { minutes }),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** 登录失败：累计次数，达到阈值锁定 */
  private async recordLoginFailure(
    tenantId: string,
    username: string,
  ): Promise<void> {
    const key = this.loginFailKey(tenantId, username);
    const count = await this.redisService.incr(key);
    const lockMs = LOCK_DURATION_MINUTES * 60_000;
    if (count === 1) {
      await this.redisService.expire(key, lockMs);
    } else {
      const ttl = await this.redisService.pttl(key);
      if (ttl < 0) {
        await this.redisService.expire(key, lockMs);
      }
    }
  }

  private async clearLoginFailure(
    tenantId: string,
    username: string,
  ): Promise<void> {
    await this.redisService.delete(this.loginFailKey(tenantId, username));
  }

  /** 图形验证码（可配置关闭） */
  private async assertCaptcha(req: {
    captchaUuid?: string;
    captchaCode?: string;
  }): Promise<void> {
    if (!this.isCaptchaEnabled()) return;
    if (!req.captchaUuid?.trim() || !req.captchaCode?.trim()) {
      throw new HttpException(
        AuthError.CAPTCHA_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.captchaService.check({
      uuid: req.captchaUuid,
      code: req.captchaCode,
      scene: 'login',
    });
  }

  /** 密码过期校验 */
  private assertPasswordNotExpired(user: UserDO): void {
    if (!this.isPasswordExpireEnabled()) return;
    if (
      isPasswordExpired(
        user.passwordUpdateTime,
        user.createTime,
        new Date(),
        PASSWORD_EXPIRE_DAYS,
      )
    ) {
      throw new HttpException(AuthError.PASSWORD_EXPIRED, HttpStatus.FORBIDDEN);
    }
  }

  // ─── 账号密码登录 ───────────────────────────────────

  async login(
    req: AuthLoginReqDTO,
    client?: AuthClientMeta,
  ): Promise<AuthLoginResDTO> {
    const tenantId = await this.resolveTenantId(req.tenantId, req.tenantName);
    await this.tenantPolicyService.assertTenantActive(tenantId);
    await this.assertCaptcha(req);
    await this.assertNotLocked(tenantId, req.username);

    const user = await this.userRepository.selectByUnique({
      username: req.username,
    });
    if (!user) {
      await this.recordLoginFailure(tenantId, req.username);
      this.writeLoginLog(
        req.username,
        1,
        undefined,
        client,
        AuthError.ACCOUNT_NOT_FOUND,
      );
      throw new HttpException(
        AuthError.ACCOUNT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    const matched = await comparePwd(req.password, user.password);
    if (!matched) {
      await this.recordLoginFailure(tenantId, req.username);
      this.writeLoginLog(
        req.username,
        1,
        user.id,
        client,
        AuthError.PASSWORD_MISMATCH,
      );
      const fails = Number(
        (await this.redisService.get<number | string>(
          this.loginFailKey(tenantId, req.username),
        )) ?? 0,
      );
      const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - fails);
      throw new HttpException(
        remaining > 0
          ? i18nKey(AuthError.PASSWORD_WRONG, { remaining })
          : AuthError.ACCOUNT_LOCKED_PERMANENT,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.status !== 1) {
      this.writeLoginLog(
        req.username,
        1,
        user.id,
        client,
        AuthError.ACCOUNT_DISABLED,
      );
      throw new HttpException(AuthError.ACCOUNT_DISABLED, HttpStatus.FORBIDDEN);
    }
    this.assertPasswordNotExpired(user);
    await this.clearLoginFailure(tenantId, req.username);
    this.writeLoginLog(req.username, 0, user.id, client);
    return this.buildLoginResp(user);
  }

  /**
   * 登出系统：有令牌则尽力回收；无令牌 / 已失效也返回 true（幂等，前端可无脑调用）
   */
  async logout(accessToken?: string): Promise<boolean> {
    if (accessToken?.trim()) {
      await this.oauth2TokenService.removeAccessToken(accessToken.trim());
    }
    return true;
  }

  /** 刷新令牌 */
  async refreshToken(
    refreshToken: string,
    client?: AuthClientMeta,
  ): Promise<AuthLoginResDTO> {
    if (!refreshToken?.trim()) {
      throw new HttpException(
        AuthError.REFRESH_TOKEN_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tenantId = await this.oauth2TokenService.resolveRefreshTenantId(
      refreshToken,
      client,
    );
    await this.tenantPolicyService.assertTenantActive(tenantId);
    const tokenRecord = await this.oauth2TokenService.refreshAccessToken(
      refreshToken,
      undefined,
      client,
    );
    return this.toAuthLoginResDTO(tokenRecord);
  }

  // ─── 登录用户权限信息 ───────────────────────────────

  /**
   * 获得登录用户的权限信息（用户信息 + 角色 + 操作权限 + 菜单树）
   */
  async getPermissionInfo(userId: number): Promise<AuthPermissionInfoResDTO> {
    // 1.1 用户信息
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(UserError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    // 1.2 角色列表（启用中的角色）
    const roleIds = await this.userRoleRepository.selectRoleIdsByUserId(userId);
    const roleList = roleIds.length
      ? await this.roleRepository.selectByIds(roleIds)
      : [];
    const enabledRoles = roleList.filter((role) => role.status === 1);
    const roleCodes = enabledRoles.map((role) => role.code);
    // 超级管理员直接拥有全部启用菜单
    const superAdmin = isSuperAdmin(roleCodes);

    // 1.3 菜单列表（按角色授权聚合，超级管理员除外）
    let menus: MenuDO[];
    if (superAdmin) {
      menus = await this.menuRepository.selectList({ status: 1 });
    } else {
      const menuIdSet = new Set<number>();
      for (const role of enabledRoles) {
        const ids = await this.roleMenuRepository.selectMenuIdsByRoleId(
          role.id,
        );
        ids.forEach((id) => menuIdSet.add(id));
      }
      menus = menuIdSet.size
        ? await this.menuRepository.selectByIds([...menuIdSet])
        : [];
      menus = menus.filter((menu) => menu.status === 1);
    }
    // 1.4 操作权限（按钮型菜单的 permission 标识）
    const permissions = [
      ...new Set(
        menus
          .filter((menu) => menu.type === 3 && menu.permission)
          .map((menu) => menu.permission!),
      ),
    ];

    // 2. 拼接结果返回
    const resp = new AuthPermissionInfoResDTO();
    resp.user = await this.buildUserDTO(user);
    resp.roles = roleCodes;
    resp.permissions = permissions;
    resp.menus = this.buildMenuTree(menus);
    return resp;
  }

  // ─── 注册 / 短信 / 找回密码 ─────────────────────────

  /** 注册（后台账号），注册成功后自动登录；需 AUTH_REGISTER_ENABLED=true */
  async register(
    req: AuthRegisterReqDTO,
    client?: AuthClientMeta,
  ): Promise<AuthLoginResDTO> {
    if (!this.isRegisterEnabled()) {
      throw new HttpException(
        AuthError.REGISTER_DISABLED,
        HttpStatus.FORBIDDEN,
      );
    }
    const tenantId = await this.resolveTenantId(req.tenantId, req.tenantName);
    await this.tenantPolicyService.assertTenantActive(tenantId);
    await this.assertCaptcha(req);
    await this.tenantPolicyService.assertCanCreateUsers(tenantId, 1);
    // 1.1 账号唯一性
    const exist = await this.userRepository.selectByUnique({
      username: req.username,
    });
    if (exist) {
      throw new HttpException(UserError.ACCOUNT_EXISTS, HttpStatus.BAD_REQUEST);
    }
    // 1.2 新建用户（默认启用）
    const userId = await this.userRepository.insert({
      tenantId,
      username: req.username,
      password: await hashPassword(req.password),
      status: 1,
      passwordUpdateTime: new Date(),
    });
    await this.userProfileRepository.upsertByUserId(userId, {
      tenantId,
      nickname: req.nickname?.trim() || req.username,
      email: req.email?.trim() || undefined,
      mobile: req.mobile?.trim() || undefined,
    });
    const user = await this.userRepository.selectById(userId);
    this.writeLoginLog(req.username, 0, userId, client);
    return this.buildLoginResp(user!);
  }

  /** 按租户+手机号定位用户（资料表） */
  private async findUserByMobile(mobile: string): Promise<UserDO | null> {
    const profile = await this.userProfileRepository.selectByUnique({
      mobile,
    });
    if (!profile) return null;
    return this.userRepository.selectById(profile.userId);
  }

  /** 短信验证码登录 */
  async smsLogin(
    req: AuthSmsLoginReqDTO,
    client?: AuthClientMeta,
  ): Promise<AuthLoginResDTO> {
    const tenantId = await this.resolveTenantId(req.tenantId);
    await this.tenantPolicyService.assertTenantActive(tenantId);
    await this.assertCaptcha(req);
    await this.assertNotLocked(tenantId, req.mobile);
    const user = await this.findUserByMobile(req.mobile);
    if (!user) {
      await this.recordLoginFailure(tenantId, req.mobile);
      throw new HttpException(
        AuthError.PHONE_NOT_REGISTERED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const ok = await this.smsCallbackService.verifySmsCode(
      req.mobile,
      this.SMS_SCENE_LOGIN,
      req.code,
    );
    if (!ok) {
      await this.recordLoginFailure(tenantId, req.mobile);
      this.writeLoginLog(
        user.username,
        1,
        user.id,
        client,
        AuthError.SMS_CODE_INVALID,
      );
      throw new HttpException(
        AuthError.SMS_CODE_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.status !== 1) {
      throw new HttpException(AuthError.ACCOUNT_DISABLED, HttpStatus.FORBIDDEN);
    }
    this.assertPasswordNotExpired(user);
    await this.clearLoginFailure(tenantId, req.mobile);
    this.writeLoginLog(user.username, 0, user.id, client);
    return this.buildLoginResp(user);
  }

  /** 发送短信验证码 */
  async sendSmsCode(req: AuthSmsSendReqDTO): Promise<boolean> {
    const tenantId = await this.resolveTenantId(req.tenantId, req.tenantName);
    await this.tenantPolicyService.assertTenantActive(tenantId);
    await this.assertCaptcha(req);
    await this.smsCallbackService.sendSmsCode(req.mobile, req.scene);
    return true;
  }

  /**
   * 重置密码（手机短信验证码）
   * 无论手机号是否存在均返回 true，避免账号枚举；失败次数计入锁定。
   */
  async resetPassword(req: AuthResetPasswordReqDTO): Promise<boolean> {
    const tenantId = await this.resolveTenantId(req.tenantId, req.tenantName);
    await this.tenantPolicyService.assertTenantActive(tenantId);
    await this.assertCaptcha(req);
    await this.assertNotLocked(tenantId, req.mobile);

    const user = await this.findUserByMobile(req.mobile);
    if (!user) {
      await this.recordLoginFailure(tenantId, req.mobile);
      return true;
    }
    const ok = await this.smsCallbackService.verifySmsCode(
      req.mobile,
      this.SMS_SCENE_RESET_PASSWORD,
      req.code,
    );
    if (!ok) {
      await this.recordLoginFailure(tenantId, req.mobile);
      throw new HttpException(
        AuthError.SMS_CODE_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.clearLoginFailure(tenantId, req.mobile);
    // 密码强度校验 + 历史密码不可复用
    await this.userPasswordService.assertNewPassword(user.id, req.password);
    const updated = await this.userRepository.updateById(user.id, {
      password: await hashPassword(req.password),
      passwordUpdateTime: new Date(),
      mustChangePassword: false,
    });
    if (updated) {
      await this.userPasswordService.recordPasswordChange(
        user.id,
        user.password,
      );
      // 重置密码后作废既有会话
      await this.userRepository.incrementPermVersionByIds([user.id]);
    }
    return true;
  }

  // ─── 社交登录 ───────────────────────────────────────

  /** 社交授权的跳转地址 */
  async socialLogin(type: number, redirectUri: string): Promise<string> {
    if (!redirectUri) {
      throw new HttpException(
        AuthError.REDIRECT_URI_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      assertSocialRedirectAllowed(redirectUri);
    } catch (e) {
      throw new HttpException(
        e instanceof Error ? e.message : AuthError.REDIRECT_URI_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tenantId = await this.resolveTenantId();
    await this.tenantPolicyService.assertTenantActive(tenantId);
    const client = await this.socialClientRepository.selectByUnique({
      socialType: type,
      userType: USER_TYPE_ADMIN,
      status: 1,
    });
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    const state = randomUUID();
    await this.redisService.set(
      `${SOCIAL_OAUTH_STATE_PREFIX}:${state}`,
      JSON.stringify({ type, tenantId, redirectUri }),
      SOCIAL_OAUTH_STATE_EXPIRE,
    );
    return buildSocialAuthorizeUrl(client, redirectUri, state);
  }

  /** 社交快捷登录（需事先绑定系统用户） */
  async socialQuickLogin(
    req: AuthSocialLoginReqDTO,
    client?: AuthClientMeta,
  ): Promise<AuthLoginResDTO> {
    if (!req.state?.trim()) {
      throw new HttpException(
        AuthError.SOCIAL_STATE_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const stateKey = `${SOCIAL_OAUTH_STATE_PREFIX}:${req.state}`;
    const statePayload = await this.redisService.get<string>(stateKey);
    if (!statePayload) {
      throw new HttpException(
        AuthError.SOCIAL_STATE_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.redisService.delete(stateKey);

    let parsed: { type?: number; tenantId?: string };
    try {
      parsed =
        typeof statePayload === 'string'
          ? JSON.parse(statePayload)
          : (statePayload as { type?: number; tenantId?: string });
    } catch {
      throw new HttpException(
        AuthError.SOCIAL_STATE_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (parsed.type != null && Number(parsed.type) !== Number(req.type)) {
      throw new HttpException(
        AuthError.SOCIAL_STATE_TYPE_MISMATCH,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tenantId = await this.resolveTenantId(parsed.tenantId);
    await this.tenantPolicyService.assertTenantActive(tenantId);

    const socialUserId = await this.socialUserService.authSocialUser(
      req.type,
      req.code,
      req.state,
      USER_TYPE_ADMIN,
    );
    const userId = await this.socialUserService.getBindUserId(
      req.type,
      socialUserId,
      USER_TYPE_ADMIN,
    );
    if (!userId) {
      throw new HttpException(
        SocialError.BIND_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(UserError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (user.status !== 1) {
      throw new HttpException(AuthError.ACCOUNT_DISABLED, HttpStatus.FORBIDDEN);
    }
    if (user.tenantId) {
      TenantContext.setTenantId(user.tenantId);
    }
    this.writeLoginLog(user.username, 0, user.id, client);
    return this.buildLoginResp(user);
  }

  // ─── 私有方法 ───────────────────────────────────────

  /** 登录成功后签发令牌（DB 持久化），并组装响应 */
  private async buildLoginResp(user: UserDO): Promise<AuthLoginResDTO> {
    const profile = await this.userProfileRepository.selectByUserId(user.id);
    const tokenRecord = await this.oauth2TokenService.createAccessToken(
      user.id,
      USER_TYPE_ADMIN,
      OAUTH2_DEFAULT_CLIENT_ID,
      {
        username: user.username,
        nickname: profile?.nickname ?? user.username,
        avatar: profile?.avatar ?? '',
      },
      [OAUTH2_DEFAULT_SCOPE],
      { tenantId: user.tenantId ?? DEFAULT_TENANT_ID },
    );
    const resp = this.toAuthLoginResDTO(tokenRecord);
    resp.mustChangePassword = !!user.mustChangePassword;
    return resp;
  }

  /** 访问令牌 DO → 登录响应 DTO */
  private toAuthLoginResDTO(tokenRecord: OAuth2AccessTokenDO): AuthLoginResDTO {
    const resp = new AuthLoginResDTO();
    resp.userId = tokenRecord.userId;
    resp.accessToken = tokenRecord.accessToken;
    resp.refreshToken = tokenRecord.refreshToken;
    resp.expiresTime = new Date(tokenRecord.expiresTime);
    return resp;
  }

  /** 写登录日志（用户/登录行为；result：0 成功 / 1 失败；failReason 记业务错误码） */
  private writeLoginLog(
    username: string,
    result: number,
    userId?: number,
    client?: AuthClientMeta,
    failReason?: string,
  ): void {
    const userIp = (client?.ip || '').slice(0, 50);
    const userAgent = (client?.userAgent || '').slice(0, 512);
    // 日志写入失败不阻塞登录主流程
    void (async () => {
      let location = '';
      try {
        location = (await this.ipService.getAreaByIp(userIp)).slice(0, 128);
      } catch {
        /* ignore */
      }
      await this.loginLogService.createLoginLog({
        logType: 1,
        username,
        result,
        userId,
        userType: USER_TYPE_ADMIN,
        userIp,
        location: location || null,
        userAgent,
        failReason: failReason ?? null,
      });
    })().catch(() => undefined);
  }

  /** 用户 DO → 权限信息中的用户 DTO */
  private async buildUserDTO(user: UserDO): Promise<AuthUserResDTO> {
    const profile = await this.userProfileRepository.selectByUserId(user.id);
    const dto = new AuthUserResDTO();
    dto.id = user.id;
    dto.nickname = profile?.nickname ?? user.username;
    dto.avatar = profile?.avatar ?? '';
    dto.deptId = user.deptId ?? 0;
    dto.username = user.username;
    dto.email = profile?.email ?? undefined;
    return dto;
  }

  /** 菜单 DO 列表 → 菜单树 DTO（排除按钮型） */
  private buildMenuTree(menus: MenuDO[]): AuthMenuResDTO[] {
    const sorted = [...menus].sort((a, b) => a.sort - b.sort || a.id - b.id);
    const nodeMap = new Map<number, AuthMenuResDTO>();
    const roots: AuthMenuResDTO[] = [];
    sorted.forEach((menu) => {
      // 按钮不作为菜单树节点
      if (menu.type === 3) {
        return;
      }
      const node = new AuthMenuResDTO();
      node.id = menu.id;
      node.parentId = menu.parentId;
      node.name = menu.name;
      node.path = menu.path ?? undefined;
      node.component = menu.component ?? undefined;
      node.componentName = menu.componentName ?? undefined;
      node.icon = menu.icon ?? undefined;
      node.visible = menu.visible;
      node.keepAlive = menu.keepAlive;
      node.alwaysShow = menu.alwaysShow;
      node.children = [];
      nodeMap.set(node.id, node);
    });
    // 构建父子关系
    nodeMap.forEach((node) => {
      const parent =
        node.parentId !== 0 ? nodeMap.get(node.parentId) : undefined;
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }
}
