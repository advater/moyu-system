import {
  Controller,
  Get,
  Put,
  Body,
} from '@nestjs/common';
import { OAuth2UserService } from './oauth2User.service';
import {
  OAuth2UserInfoResDTO,
  OAuth2UserUpdateReqDTO,
} from './dto/oauth2User.dto';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * OAuth2 用户 Controller
 */
@ApiTags('OAuth2.0 用户')
@Controller()
export class OAuth2UserController {
  constructor(private readonly oauth2UserService: OAuth2UserService) {}

  @Get('get')
  @ApiOperation({ summary: '获得用户信息' })
  @ApiResponse({ status: 200, description: '获取用户信息成功' })
  getUserInfo(@LoginUser() loginUser: LoginUser) {
    return this.oauth2UserService.getUserInfo(
      loginUser?.id,
      loginUser?.userType,
    );
  }

  @Put('update')
  @ApiOperation({ summary: '修改用户基本信息' })
  @ApiResponse({ status: 200, description: '修改用户基本信息成功' })
  updateUserInfo(
    @LoginUser() loginUser: LoginUser,
    @Body() req: OAuth2UserUpdateReqDTO,
  ) {
    return this.oauth2UserService.updateUserInfo(
      loginUser?.id,
      loginUser?.userType,
      req,
    );
  }
}
