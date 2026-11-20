import { OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
} from '@nestjs/common';
import { DeptService } from './dept.service';
import {
  DeptListReqDTO,
  DeptSaveReqDTO,
} from './dto/dept.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { resolveId, resolveIds } from '@/utils/resolve-id';

/**
 * 部门 Controller
 */
@ApiTags('部门')
@Controller()
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Post('create')
  @Permission('system:dept:create')
  @OperateLog({ type: OpLogType.DEPT, subType: OpLogSub.DEPT_CREATE })
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({ status: 200, description: '创建部门成功，返回部门编号' })
  createDept(
    @Body() req: DeptSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.createDept(req, loginUser);
  }

  @Put('update')
  @Permission('system:dept:update')
  @OperateLog({ type: OpLogType.DEPT, subType: OpLogSub.DEPT_UPDATE })
  @ApiOperation({ summary: '修改部门' })
  @ApiResponse({ status: 200, description: '修改部门成功' })
  updateDept(
    @Body() req: DeptSaveReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.updateDept(req, loginUser);
  }

  @Delete('delete')
  @Permission('system:dept:delete')
  @OperateLog({ type: OpLogType.DEPT, subType: OpLogSub.DEPT_DELETE })
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({ status: 200, description: '删除部门成功' })
  deleteDept(
    @Body('id') bodyId: number | undefined,
    @Query('id') queryId: number | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.deleteDept(resolveId(bodyId, queryId), loginUser);
  }

  @Delete('delete-list')
  @Permission('system:dept:delete')
  @OperateLog({ type: OpLogType.DEPT, subType: OpLogSub.DEPT_DELETE_BATCH })
  @ApiOperation({ summary: '批量删除部门（Body.ids 优先）' })
  @ApiResponse({ status: 200, description: '批量删除部门成功' })
  deleteDeptList(
    @Body('ids') bodyIds: number[] | undefined,
    @Query('ids') queryIds: number[] | undefined,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.deleteDeptList(
      resolveIds(bodyIds, queryIds),
      loginUser,
    );
  }

  @Get('list')
  @Permission('system:dept:query')
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResponse({ status: 200, description: '获取部门列表成功' })
  getDeptList(
    @Query() req: DeptListReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.getDeptList(req, loginUser);
  }

  @Get('simple-list')
  @Permission('system:dept:query')
  @ApiOperation({
    summary: '获取部门精简信息列表',
    description: '只包含被开启的部门，主要用于前端的下拉选项',
  })
  @ApiResponse({
    status: 200,
    description: '只包含被开启的部门，主要用于前端的下拉选项',
  })
  getSimpleDeptList(@LoginUser() loginUser: LoginUser) {
    return this.deptService.getSimpleDeptList(loginUser);
  }

  @Get('get')
  @Permission('system:dept:query')
  @ApiOperation({ summary: '获取部门详情' })
  @ApiResponse({ status: 200, description: '获取部门详情成功' })
  getDept(
    @Query('id') id: number,
    @LoginUser() loginUser: LoginUser,
  ) {
    return this.deptService.getDept(id, loginUser);
  }
}
