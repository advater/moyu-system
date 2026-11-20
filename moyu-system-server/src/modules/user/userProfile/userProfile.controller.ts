import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserError } from '@/config/error-messages';
import { UserProfileService } from './userProfile.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import {
  UserProfileResDTO,
  UserProfileUpdatePasswordReqDTO,
  UserProfileUpdateReqDTO,
} from './dto/userProfile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

/**
 * 用户信息 Controller
 */
@ApiTags('用户信息')
@Controller()
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('get')
  @ApiOperation({ summary: '获得登录用户信息' })
  @ApiResponse({
    status: 200,
    description: '成功返回用户信息（含角色/部门/岗位）',
  })
  getUserProfile(@LoginUser() loginUser: LoginUser): Promise<UserProfileResDTO> {
    return this.userProfileService.getUserProfileById(loginUser.id);
  }

  @Put('update')
  @ApiOperation({ summary: '修改用户个人信息' })
  @ApiResponse({ status: 200, description: '修改用户个人信息成功' })
  updateProfile(
    @LoginUser() loginUser: LoginUser,
    @Body() req: UserProfileUpdateReqDTO,
  ): Promise<boolean> {
    return this.userProfileService.updateProfileById(loginUser.id, req);
  }

  @Post('update-avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: '上传并更新个人头像' })
  @ApiResponse({ status: 200, description: '返回头像 URL' })
  async updateAvatar(
    @LoginUser() loginUser: LoginUser,
    @Req() req: FastifyRequest,
  ): Promise<string> {
    const data = await req.file();
    if (!data) {
      throw new HttpException(UserError.AVATAR_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const buffer = await data.toBuffer();
    return this.userProfileService.updateAvatar(
      loginUser.id,
      buffer,
      data.filename || 'avatar.png',
      data.mimetype,
    );
  }

  @Put('update-password')
  @ApiOperation({ summary: '修改用户个人密码' })
  @ApiResponse({ status: 200, description: '修改用户个人密码成功' })
  updatePassword(
    @LoginUser() loginUser: LoginUser,
    @Body() req: UserProfileUpdatePasswordReqDTO,
  ): Promise<boolean> {
    return this.userProfileService.updatePasswordByUserId(loginUser.id, req);
  }
}
