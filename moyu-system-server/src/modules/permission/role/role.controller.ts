import { OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { RoleService } from './role.service';
import {
  RolePageReqDTO,
  RoleResDTO,
  RoleSaveReqDTO,
  RoleSimpleResDTO,
} from './dto/role.dto';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { resolveId, resolveIds } from '@/utils/resolve-id';
import { LoginUser } from '@/common/decorator/login-user.decorator';

/**
 * 角色 Controller
 */
@ApiTags('角色')
@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('create')
  @Permission('system:role:create')
  @OperateLog({ type: OpLogType.ROLE, subType: OpLogSub.ROLE_CREATE })
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 200, description: '创建角色成功' })
  createRole(
    @Body() req: RoleSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.createRole(req, loginUser);
  }

  @Post('copy')
  @Permission('system:role:create')
  @OperateLog({ type: OpLogType.ROLE, subType: OpLogSub.ROLE_COPY })
  @ApiOperation({ summary: '复制角色（含菜单）' })
  copyRole(
    @Body('id') id: number,
    @Body('name') name: string,
    @Body('code') code: string,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.copyRole(id, { name, code }, loginUser);
  }

  @Put('update')
  @Permission('system:role:update')
  @OperateLog({ type: OpLogType.ROLE, subType: OpLogSub.ROLE_UPDATE })
  @ApiOperation({ summary: '修改角色信息' })
  @ApiResponse({ status: 200, description: '修改角色成功' })
  updateRole(
    @Body() req: RoleSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.updateRole(req, loginUser);
  }

  @Delete('delete')
  @Permission('system:role:delete')
  @OperateLog({ type: OpLogType.ROLE, subType: OpLogSub.ROLE_DELETE })
  @ApiOperation({ summary: '删除角色（Body.id 优先）' })
  @ApiResponse({ status: 200, description: '删除角色删除成功' })
  deleteRole(
    @Body('id') bodyId: number | undefined,
    @Query('id') queryId: number | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.deleteRole(resolveId(bodyId, queryId), loginUser);
  }

  @Delete('delete-list')
  @Permission('system:role:delete')
  @OperateLog({ type: OpLogType.ROLE, subType: OpLogSub.ROLE_DELETE_BATCH })
  @ApiOperation({ summary: '批量删除角色（Body.ids 优先）' })
  @ApiResponse({ status: 200, description: '批量删除角色删除成功' })
  deleteRoleList(
    @Body('ids') bodyIds: number[] | undefined,
    @Query('ids') queryIds: number[] | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.deleteRoleList(
      resolveIds(bodyIds, queryIds),
      loginUser,
    );
  }

  @Get('get')
  @Permission('system:role:query')
  @ApiOperation({ summary: '获取角色信息' })
  @ApiResponse({ status: 200, description: '获取角色信息成功' })
  getRole(
    @Query('id') id: number,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.getRole(id, loginUser);
  }

  @Get('page')
  @Permission('system:role:query')
  @ApiOperation({ summary: '获取角色分页列表' })
  @ApiResponse({ status: 200, description: '获取角色分页列表成功' })
  getRolePage(
    @Query() req: RolePageReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.roleService.getRolePage(req, loginUser);
  }

  @Get('simple-list')
  @Permission('system:role:query')
  @ApiOperation({
    summary: '获取角色精简信息列表',
    description: '只包含被开启的角色，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获取角色精简信息列表成功' })
  getSimpleRoleList(@LoginUser() loginUser: LoginUser) {
    return this.roleService.getSimpleRoleList(loginUser);
  }

  @Get('export-excel')
  @Permission('system:role:export')
  @RawResponse()
  @ApiOperation({ summary: '导出角色列表为Excel' })
  @ApiResponse({ status: 200, description: '导出角色列表为Excel成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.roleService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
