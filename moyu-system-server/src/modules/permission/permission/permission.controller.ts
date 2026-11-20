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
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  PermissionAssignRoleDataScopeReqDTO,
  PermissionAssignRoleMenuReqDTO,
  PermissionAssignUserRoleReqDTO,
} from './dto/permission.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { LoginUser } from '@/common/decorator/login-user.decorator';

/**
 * 权限分配 Controller
 */
@ApiTags('权限分配')
@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('list-role-menus')
  @Permission('system:permission:assign-role-menu')
  @ApiOperation({ summary: '查询角色拥有的菜单编号列表' })
  @ApiResponse({ status: 200, description: '获取角色拥有的菜单编号列表成功' })
  getRoleMenuList(@Query('roleId') roleId: string) {
    return this.permissionService.getRoleMenuList(roleId);
  }

  @Post('assign-role-menu')
  @Permission('system:permission:assign-role-menu')
  @OperateLog({ type: OpLogType.PERMISSION, subType: OpLogSub.ASSIGN_ROLE_MENU })
  @ApiOperation({ summary: '赋予角色菜单' })
  @ApiResponse({ status: 200, description: '赋予角色菜单成功' })
  assignRoleMenu(@Body() req: PermissionAssignRoleMenuReqDTO) {
    return this.permissionService.assignRoleMenu(req);
  }

  @Post('assign-role-data-scope')
  @Permission('system:permission:assign-role-data-scope')
  @OperateLog({ type: OpLogType.PERMISSION, subType: OpLogSub.ASSIGN_ROLE_DATA_SCOPE })
  @ApiOperation({ summary: '赋予角色数据权限' })
  @ApiResponse({ status: 200, description: '赋予角色数据权限成功' })
  assignRoleDataScope(@Body() req: PermissionAssignRoleDataScopeReqDTO) {
    return this.permissionService.assignRoleDataScope(req);
  }

  @Get('list-user-roles')
  @Permission('system:permission:assign-user-role')
  @ApiOperation({ summary: '获得管理员拥有的角色编号列表' })
  @ApiResponse({ status: 200, description: '获取管理员拥有的角色编号列表成功' })
  listAdminRoles(
    @Query('userId') userId: string,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.permissionService.listAdminRoles(userId, loginUser);
  }

  @Post('assign-user-role')
  @Permission('system:permission:assign-user-role')
  @OperateLog({ type: OpLogType.PERMISSION, subType: OpLogSub.ASSIGN_USER_ROLE })
  @ApiOperation({ summary: '赋予用户角色' })
  @ApiResponse({ status: 200, description: '赋予用户角色成功' })
  assignUserRole(
    @Body() req: PermissionAssignUserRoleReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.permissionService.assignUserRole(req, loginUser);
  }
}
