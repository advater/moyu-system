import { Controller, Get, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { JobLogPageReqDTO, JobLogResDTO } from './dto/job.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { Roles } from '@/common/decorator/auth.decorator';
import { SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';

@ApiTags('定时任务日志')
@Controller()
export class JobLogController {
  constructor(private readonly jobService: JobService) {}

  @Get('get')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:query')
  @ApiOperation({ summary: '获得任务日志' })
  @ApiResponse({ status: 200, type: JobLogResDTO })
  getJobLog(@Query('id') id: number) {
    return this.jobService.getJobLog(id);
  }

  @Get('page')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:query')
  @ApiOperation({ summary: '任务日志分页' })
  getJobLogPage(@Query() query: JobLogPageReqDTO) {
    return this.jobService.getJobLogPage(query);
  }
}
