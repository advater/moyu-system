import { OpLogSub, OpLogType } from '@/config/error-messages';
import { Controller, Get, Put, Query, Body } from '@nestjs/common';
import { ApiErrorLogService } from './apiErrorLog.service';
import {
  ApiErrorLogPageReqDTO,
  ApiErrorLogProcessReqDTO,
  ApiErrorLogResDTO,
} from './dto/apiErrorLog.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { Roles } from '@/common/decorator/auth.decorator';
import { LoginUser, type LoginUser as LoginUserType } from '@/common/decorator/login-user.decorator';
import { SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';

@ApiTags('API 异常日志')
@Controller()
export class ApiErrorLogController {
  constructor(private readonly service: ApiErrorLogService) {}

  @Get('get')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:api-error-log:query')
  @ApiOperation({ summary: '获得异常日志' })
  @ApiResponse({ status: 200, type: ApiErrorLogResDTO })
  get(@Query('id') id: number) {
    return this.service.get(id);
  }

  @Get('page')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:api-error-log:query')
  @ApiOperation({ summary: '异常日志分页' })
  page(@Query() query: ApiErrorLogPageReqDTO) {
    return this.service.page(query);
  }

  @Put('update-status')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:api-error-log:update')
  @OperateLog({ type: OpLogType.API_ERROR_LOG, subType: OpLogSub.PROCESS })
  @ApiOperation({ summary: '处理异常日志' })
  process(
    @Body() req: ApiErrorLogProcessReqDTO,
    @LoginUser() user: LoginUserType,
  ) {
    return this.service.process(req, user.id);
  }
}
