import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Req,
  StreamableFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OpLogSub, OpLogType, UserError } from '@/config/error-messages';
import { UserService } from './user.service';
import {
  UserPageReqDTO,
  UserSaveReqDTO,
  UserUpdatePasswordReqDTO,
  UserUpdateStatusReqDTO,
} from './dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import type { FastifyRequest } from 'fastify';
import { resolveId, resolveIds } from '@/utils/resolve-id';
import { Throttle } from '@nestjs/throttler';

/**
 * 用户管理 Controller
 */
@ApiTags('用户管理')
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Permission('system:user:create')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_CREATE })
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 200, description: '创建用户成功，返回用户编号' })
  createUser(
    @Body() req: UserSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.createUser(req, loginUser);
  }

  @Put('update')
  @Permission('system:user:update')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_UPDATE })
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '更新用户信息成功' })
  updateUser(
    @Body() req: UserSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.updateUser(req, loginUser);
  }

  @Delete('delete')
  @Permission('system:user:delete')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_DELETE })
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除用户成功' })
  deleteUser(
    @Body('id') bodyId: number | undefined,
    @Query('id') queryId: number | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.deleteUser(
      resolveId(bodyId, queryId),
      loginUser,
    );
  }

  @Delete('delete-list')
  @Permission('system:user:delete')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_DELETE_BATCH })
  @ApiOperation({ summary: '批量删除用户（Body.ids 优先）' })
  @ApiResponse({ status: 200, description: '批量删除用户成功' })
  deleteUserList(
    @Body('ids') bodyIds: number[] | undefined,
    @Query('ids') queryIds: number[] | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.deleteUserList(
      resolveIds(bodyIds, queryIds),
      loginUser,
    );
  }

  @Put('update-password')
  @Permission('system:user:update-password')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_RESET_PASSWORD })
  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ status: 200, description: '重置密码成功' })
  updateUserPassword(
    @Body() req: UserUpdatePasswordReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.updateUserPassword(req, loginUser);
  }

  @Put('update-status')
  @Permission('system:user:update')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_UPDATE_STATUS })
  @ApiOperation({ summary: '修改用户状态' })
  @ApiResponse({ status: 200, description: '修改用户状态成功' })
  updateUserStatus(
    @Body() req: UserUpdateStatusReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.updateUserStatus(req, loginUser);
  }

  @Get('page')
  @Permission('system:user:query')
  @ApiOperation({ summary: '获取用户分页列表' })
  @ApiResponse({ status: 200, description: '获取用户分页列表成功' })
  getUserPage(
    @Query() req: UserPageReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.getUserPage(req, loginUser);
  }

  @Get('list')
  @Permission('system:user:query')
  @ApiOperation({ summary: '获取用户详情列表' })
  @ApiResponse({ status: 200, description: '获取用户详情列表成功' })
  getUserList(
    @Query('ids') ids: number[],
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.getUserList(ids, loginUser);
  }

  @Get('simple-list')
  @Permission('system:user:query')
  @ApiOperation({
    summary: '获取用户精简信息列表',
    description: '只包含被开启的用户，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获取用户精简信息列表成功' })
  getSimpleUserList(
    @Query('deptId') deptId?: number,
    @LoginUser() loginUser?: LoginUser,
  ) {
    return this.userService.getSimpleUserList(deptId, loginUser);
  }

  @Get('get')
  @Permission('system:user:query')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取用户信息成功' })
  getUser(
    @Query('id') id: number,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.getUser(id, loginUser);
  }

  @Get('export-excel')
  @Permission('system:user:export')
  @RawResponse()
  @ApiOperation({
    summary: '导出用户Excel文件',
  })
  @ApiResponse({ status: 200, description: '导出用户Excel文件成功' })
  async exportExcel(
    @LoginUser() loginUser: LoginUser,
  ): Promise<StreamableFile> {
    const file = await this.userService.exportExcel(loginUser);
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }

  @Get('get-import-template')
  @Permission('system:user:import')
  @RawResponse()
  @ApiOperation({ summary: '获得导入用户模板' })
  @ApiResponse({ status: 200, description: '获得导入用户模板成功' })
  async getImportTemplate(): Promise<StreamableFile> {
    const file = await this.userService.getImportTemplate();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }

  @Post('import')
  @Permission('system:user:import')
  @OperateLog({ type: OpLogType.USER, subType: OpLogSub.USER_IMPORT })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '导入用户' })
  @ApiResponse({ status: 200, description: '导入用户成功' })
  async importUser(
    @Req() req: FastifyRequest,
    @LoginUser() loginUser: LoginUser,
    @Query('updateSupport') updateSupport?: string,
  ) {
    const data = await req.file();
    if (!data) {
      throw new HttpException(UserError.IMPORT_EXCEL_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const buffer = await data.toBuffer();
    const support =
      updateSupport === 'true' ||
      updateSupport === '1' ||
      updateSupport === 'TRUE';
    return this.userService.importUser(buffer, support, loginUser);
  }

  // ==================== 登录即可（IM 名片 / 搜索）；须过 dataScope ====================
  @Get('get-simple')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: '获得用户精简信息',
    description: '用于点头像弹名片等场景；需登录，且目标须在操作者数据权限内',
  })
  @ApiResponse({ status: 200, description: '获得用户精简信息成功' })
  getSimpleUser(
    @Query('id') id: number,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.getSimpleUser(id, loginUser);
  }

  @Get('list-by-nickname')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: '按昵称模糊搜索用户精简信息',
    description: '用于加好友等场景；需登录；结果按 dataScope 过滤',
  })
  @ApiResponse({ status: 200, description: '按昵称模糊搜索用户精简信息成功' })
  getListByNickname(
    @Query('nickname') nickname: string,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.userService.getListByNickname(nickname, loginUser);
  }
}
