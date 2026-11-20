import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Headers,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { OAuth2OpenService } from './oauth2Open.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { SkipAuth } from '@/common/decorator/auth.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OAuth2OpenTokenReqDTO } from './dto/OAuth2OpenTokenReq.dto';
import { OAuth2OpenTokenCheckReqDTO } from './dto/OAuth2OpenTokenCheckReq.dto';

/**
 * OAuth2 授权 Controller
 *
 * 说明：
 * - /token、/check-token、DELETE /token 使用「客户端凭证」Basic 认证，
 *   全局 JwtGuard 跳过（@SkipAuth），由 service 校验 Authorization: Basic base64(clientId:secret)。
 * - GET /authorize 与 POST /authorize 需要「用户」登录态，由全局 JwtGuard 校验，
 *   通过 @LoginUser 注入当前用户。
 * - POST /token 参数走 Body，避免 refresh_token 等敏感字段进入 Query/访问日志。
 */
@ApiTags('OAuth2.0 授权')
@Controller()
export class OAuth2OpenController {
  constructor(private readonly oauth2OpenService: OAuth2OpenService) {}

  @Post('token')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: '获得访问令牌',
    description:
      '支持 authorization_code / refresh_token；参数通过 Body 提交。password 模式请使用 /admin/auth/login。',
  })
  @ApiResponse({ status: 200, description: '获得访问令牌成功' })
  postAccessToken(
    @Headers('authorization') authorization: string,
    @Body() body: OAuth2OpenTokenReqDTO,
    @Req() request: FastifyRequest,
  ) {
    return this.oauth2OpenService.postAccessToken(
      {
        grantType: body.grant_type,
        code: body.code,
        redirectUri: body.redirect_uri,
        state: body.state,
        scope: body.scope,
        refreshToken: body.refresh_token,
      },
      authorization,
      {
        ip: request.ip,
        userAgent: String(request.headers['user-agent'] ?? ''),
      },
    );
  }

  @Delete('token')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '删除访问令牌（token 放 Body）' })
  @ApiResponse({ status: 200, description: '删除访问令牌成功' })
  revokeToken(
    @Headers('authorization') authorization: string,
    @Body() body: OAuth2OpenTokenCheckReqDTO,
  ) {
    return this.oauth2OpenService.revokeToken(body.token, authorization);
  }

  @Post('check-token')
  @SkipAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: '校验访问令牌（token 放 Body）' })
  @ApiResponse({ status: 200, description: '校验访问令牌成功' })
  checkToken(
    @Headers('authorization') authorization: string,
    @Body() body: OAuth2OpenTokenCheckReqDTO,
  ) {
    return this.oauth2OpenService.checkToken(body.token, authorization);
  }

  @Get('authorize')
  @ApiOperation({
    summary: '获得授权信息',
    description: '授权码模式（code）；在 sso 单点登录界面被【获取】调用',
  })
  @ApiResponse({ status: 200, description: '获得授权信息成功' })
  authorize(
    @LoginUser() loginUser: LoginUser,
    @Query('clientId') clientId: string,
  ) {
    return this.oauth2OpenService.authorize(clientId, loginUser);
  }

  @Post('authorize')
  @ApiOperation({
    summary: '申请授权',
    description: '授权码模式（code）；在 sso 单点登录界面被【提交】调用',
  })
  @ApiResponse({ status: 200, description: '申请授权成功，返回重定向 URL' })
  approveOrDeny(
    @LoginUser() loginUser: LoginUser,
    @Query('response_type') responseType: string,
    @Query('client_id') clientId: string,
    @Query('scope') scope: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('auto_approve') autoApprove: boolean,
    @Query('state') state: string,
  ) {
    return this.oauth2OpenService.approveOrDeny(
      {
        responseType,
        clientId,
        scope,
        redirectUri,
        autoApprove,
        state,
      },
      loginUser,
    );
  }
}
