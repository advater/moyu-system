import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
} from '@nestjs/common';
import { SocialUserService } from './socialUser.service';
import {
  SocialUserBindReqDTO,
  SocialUserPageReqDTO,
  SocialUserUnbindReqDTO,
} from './dto/socialUser.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { LoginUser } from '@/common/decorator/login-user.decorator';

/**
 * 社交用户 Controller
 */
@ApiTags('社交用户')
@Controller()
export class SocialUserController {
  constructor(private readonly socialUserService: SocialUserService) {}

  @Post('bind')
  @ApiOperation({ summary: '社交绑定，使用 code 授权码' })
  @ApiResponse({ status: 200, description: '社交绑定用户成功' })
  socialBind(
    @Body() req: SocialUserBindReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.socialUserService.socialBind(req, loginUser);
  }

  @Delete('unbind')
  @ApiOperation({ summary: '取消社交绑定' })
  @ApiResponse({ status: 200, description: '社交解绑用户成功' })
  socialUnbind(
    @Body() req: SocialUserUnbindReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.socialUserService.socialUnbind(req, loginUser);
  }

  @Get('get-bind-list')
  @ApiOperation({ summary: '获得绑定社交用户列表' })
  @ApiResponse({ status: 200, description: '获得绑定社交用户列表成功' })
  getBindSocialUserList(@LoginUser() loginUser: LoginUser) {
    return this.socialUserService.getBindSocialUserList(loginUser);
  }

  @Get('get')
  @Permission('system:social-user:query')
  @ApiOperation({ summary: '获得社交用户' })
  @ApiResponse({ status: 200, description: '获得社交用户信息成功' })
  getSocialUser(@Query('id') id: number) {
    return this.socialUserService.getSocialUser(id);
  }

  @Get('page')
  @Permission('system:social-user:query')
  @ApiOperation({ summary: '获得社交用户分页列表' })
  @ApiResponse({ status: 200, description: '获得社交用户分页列表成功' })
  getSocialUserPage(@Query() req: SocialUserPageReqDTO) {
    return this.socialUserService.getSocialUserPage(req);
  }
}
