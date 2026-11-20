import { OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Delete,
  Query,
  Body,
  Put,
} from '@nestjs/common';
import { OAuth2TokenService } from './oauth2Token.service';
import {
  OAuth2TokenPageReqDTO,
  OAuth2TokenResDTO,
  OnlineUserPageReqDTO,
} from './dto/oauth2Token.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';

/**
 * OAuth2 令牌 Controller（含在线用户 / 强制下线）
 */
@ApiTags('OAuth2.0 令牌')
@Controller()
export class OAuth2TokenController {
  constructor(private readonly oauth2TokenService: OAuth2TokenService) {}

  @Get('page')
  @Permission('system:oauth2-token:query')
  @ApiOperation({
    summary: '获得访问令牌分页',
    description: '只返回有效期内的',
  })
  @ApiResponse({ status: 200, description: '获取访问令牌分页列表成功' })
  getAccessTokenPage(@Query() req: OAuth2TokenPageReqDTO) {
    return this.oauth2TokenService.getAccessTokenPage(req);
  }

  @Get('online-page')
  @Permission('system:oauth2-token:query')
  @ApiOperation({ summary: '在线用户（有效令牌）分页' })
  @ApiResponse({ status: 200, type: [OAuth2TokenResDTO] })
  getOnlineUserPage(@Query() req: OnlineUserPageReqDTO) {
    return this.oauth2TokenService.getOnlineUserPage(req);
  }

  @Put('force-logout')
  @Permission('system:oauth2-token:delete')
  @OperateLog({ type: OpLogType.ONLINE_USER, subType: OpLogSub.FORCE_LOGOUT })
  @ApiOperation({ summary: '按用户强制下线（吊销全部有效令牌）' })
  forceLogout(
    @Body('userId') userId: number,
    @Body('userType') userType?: number,
  ) {
    return this.oauth2TokenService.forceLogoutByUserId(userId, userType);
  }

  @Delete('delete')
  @Permission('system:oauth2-token:delete')
  @ApiOperation({ summary: '删除访问令牌' })
  @ApiResponse({ status: 200, description: '删除访问令牌成功' })
  deleteAccessToken(
    @Body('accessToken') accessToken: string,
    @Query('accessToken') accessTokenQuery?: string,
  ) {
    return this.oauth2TokenService.deleteAccessToken(
      accessToken ?? accessTokenQuery!,
    );
  }

  @Delete('delete-list')
  @Permission('system:oauth2-token:delete')
  @ApiOperation({ summary: '批量删除访问令牌' })
  @ApiResponse({ status: 200, description: '批量删除访问令牌成功' })
  deleteAccessTokenList(
    @Body('accessTokens') accessTokens: string[],
    @Query('accessTokens') accessTokensQuery?: string[],
  ) {
    return this.oauth2TokenService.deleteAccessTokenList(
      accessTokens ?? accessTokensQuery ?? [],
    );
  }
}
