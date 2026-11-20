import { Controller, Get, Query } from '@nestjs/common';
import { ApiAccessLogService } from './apiAccessLog.service';
import {
  ApiAccessLogPageReqDTO,
  ApiAccessLogResDTO,
} from './dto/apiAccessLog.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { Roles } from '@/common/decorator/auth.decorator';
import { SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';

@ApiTags('API 访问日志')
@Controller()
export class ApiAccessLogController {
  constructor(private readonly service: ApiAccessLogService) {}

  @Get('get')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:api-access-log:query')
  @ApiOperation({ summary: '获得访问日志' })
  @ApiResponse({ status: 200, type: ApiAccessLogResDTO })
  get(@Query('id') id: number) {
    return this.service.get(id);
  }

  @Get('page')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:api-access-log:query')
  @ApiOperation({ summary: '访问日志分页' })
  page(@Query() query: ApiAccessLogPageReqDTO) {
    return this.service.page(query);
  }
}
