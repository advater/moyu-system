import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthClientMeta } from './auth.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { SkipAuth } from '@/common/decorator/auth.decorator';
import {
  AuthLoginReqDTO,
  AuthLoginResDTO,
  AuthPermissionInfoResDTO,
  AuthRefreshTokenReqDTO,
  AuthRegisterReqDTO,
  AuthResetPasswordReqDTO,
  AuthSmsLoginReqDTO,
  AuthSmsSendReqDTO,
  AuthSocialLoginReqDTO,
} from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from '@/utils/refresh-cookie';
import requestIp from 'request-ip';

/**
 * 认证管理 Controller
 */
@ApiTags('认证管理')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private clientMeta(request: FastifyRequest): AuthClientMeta {
    const ip =
      requestIp.getClientIp(request) ||
      request.ip ||
      '';
    const userAgent = String(request.headers['user-agent'] || '');
    return { ip, userAgent };
  }

  private async withRefreshCookie(
    reply: FastifyReply,
    result: Promise<AuthLoginResDTO>,
  ): Promise<AuthLoginResDTO> {
    const resp = await result;
    setRefreshTokenCookie(reply, resp.refreshToken);
    return resp;
  }

  @Post('login')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '使用账号密码登录' })
  @ApiResponse({ status: 200, description: '成功返回登录信息' })
  login(
    @Body() req: AuthLoginReqDTO,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthLoginResDTO> {
    return this.withRefreshCookie(
      reply,
      this.authService.login(req, this.clientMeta(request)),
    );
  }

  @Post('logout')
  @SkipAuth()
  @ApiOperation({
    summary: '登出系统',
    description:
      '匿名可调用：有 accessToken 则回收服务端会话，无/无效 token 也返回成功（对齐 yudao @PermitAll）',
  })
  @ApiResponse({ status: 200, description: '成功登出' })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<boolean> {
    clearRefreshTokenCookie(reply);
    const raw = String(request.headers.authorization ?? '');
    const token = raw.startsWith('Bearer ')
      ? raw.slice(7).trim()
      : raw.startsWith('Bearer')
        ? raw.slice(6).trim()
        : raw.trim();
    return this.authService.logout(token || undefined);
  }

  @Post('/refresh-token')
  @SkipAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: '刷新token（优先 httpOnly Cookie，Body 兼容）',
  })
  @ApiResponse({ status: 200, description: '成功刷新token信息' })
  refreshToken(
    @Body() req: AuthRefreshTokenReqDTO,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthLoginResDTO> {
    const token =
      req.refreshToken?.trim() || readRefreshTokenCookie(request) || '';
    return this.withRefreshCookie(
      reply,
      this.authService.refreshToken(token, this.clientMeta(request)),
    );
  }

  @Get('/get-permission-info')
  @ApiOperation({ summary: '获取登录用户的权限信息' })
  @ApiResponse({ status: 200, description: '成功返回登录用户的权限信息' })
  getPermissionInfo(
    @LoginUser() loginUser: LoginUser,
  ): Promise<AuthPermissionInfoResDTO> {
    return this.authService.getPermissionInfo(loginUser.id);
  }

  @Post('/register')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: '注册用户（需 AUTH_REGISTER_ENABLED=true）',
  })
  @ApiResponse({ status: 200, description: '成功注册用户' })
  register(
    @Body() req: AuthRegisterReqDTO,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthLoginResDTO> {
    return this.withRefreshCookie(
      reply,
      this.authService.register(req, this.clientMeta(request)),
    );
  }

  @Post('/sms-login')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '使用短信验证码登录' })
  @ApiResponse({ status: 200, description: '成功返回登录信息（短信登录）' })
  smsLogin(
    @Body() req: AuthSmsLoginReqDTO,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthLoginResDTO> {
    return this.withRefreshCookie(
      reply,
      this.authService.smsLogin(req, this.clientMeta(request)),
    );
  }

  @Post('/send-sms-code')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '发送手机验证码' })
  @ApiResponse({ status: 200, description: '成功发送手机验证码' })
  sendSmsCode(@Body() req: AuthSmsSendReqDTO): Promise<boolean> {
    return this.authService.sendSmsCode(req);
  }

  @Post('/reset-password')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '成功重置密码' })
  resetPassword(@Body() req: AuthResetPasswordReqDTO): Promise<boolean> {
    return this.authService.resetPassword(req);
  }

  @Get('/social-auth-redirect')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '社交授权的跳转' })
  @ApiResponse({ status: 200, description: '成功跳转到社交登录页面' })
  socialLogin(
    @Query('type') type: number,
    @Query('redirectUri') redirectUri: string,
  ): Promise<string> {
    return this.authService.socialLogin(type, redirectUri);
  }

  @Post('/social-login')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '社交快捷登录，使用 code 授权码' })
  @ApiResponse({ status: 200, description: '成功返回登录信息（社交登录）' })
  socialQuickLogin(
    @Body() req: AuthSocialLoginReqDTO,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthLoginResDTO> {
    return this.withRefreshCookie(
      reply,
      this.authService.socialQuickLogin(req, this.clientMeta(request)),
    );
  }
}
