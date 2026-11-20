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
import { JobService } from './job.service';
import {
  JobPageReqDTO,
  JobResDTO,
  JobSaveReqDTO,
  JobUpdateStatusReqDTO,
} from './dto/job.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { Roles } from '@/common/decorator/auth.decorator';
import { SYSTEM_ADMIN_ROLE_CODE } from '@/config/constants';

@ApiTags('定时任务')
@Controller()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('create')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:create')
  @OperateLog({ type: OpLogType.JOB, subType: OpLogSub.CREATE })
  @ApiOperation({ summary: '创建定时任务' })
  createJob(@Body() req: JobSaveReqDTO) {
    return this.jobService.createJob(req);
  }

  @Put('update')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:update')
  @OperateLog({ type: OpLogType.JOB, subType: OpLogSub.UPDATE })
  @ApiOperation({ summary: '更新定时任务' })
  updateJob(@Body() req: JobSaveReqDTO) {
    return this.jobService.updateJob(req);
  }

  @Put('update-status')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:update')
  @OperateLog({ type: OpLogType.JOB, subType: OpLogSub.TOGGLE })
  @ApiOperation({ summary: '启停定时任务' })
  updateJobStatus(@Body() req: JobUpdateStatusReqDTO) {
    return this.jobService.updateJobStatus(req);
  }

  @Delete('delete')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:delete')
  @OperateLog({ type: OpLogType.JOB, subType: OpLogSub.DELETE })
  @ApiOperation({ summary: '删除定时任务' })
  deleteJob(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.jobService.deleteJob(id ?? idQuery!);
  }

  @Get('get')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:query')
  @ApiOperation({ summary: '获得定时任务' })
  @ApiResponse({ status: 200, type: JobResDTO })
  getJob(@Query('id') id: number) {
    return this.jobService.getJob(id);
  }

  @Get('page')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:query')
  @ApiOperation({ summary: '定时任务分页' })
  getJobPage(@Query() query: JobPageReqDTO) {
    return this.jobService.getJobPage(query);
  }

  @Put('trigger')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:trigger')
  @OperateLog({ type: OpLogType.JOB, subType: OpLogSub.TRIGGER })
  @ApiOperation({ summary: '手动触发一次' })
  triggerJob(@Body('id') id: number) {
    return this.jobService.triggerJob(id);
  }

  @Get('handler-list')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:query')
  @ApiOperation({ summary: '内置处理器列表' })
  listHandlers() {
    return this.jobService.listHandlers();
  }

  /** @deprecated 兼容旧接口；请用 trigger */
  @Post('clean-expired-tokens')
  @Roles(SYSTEM_ADMIN_ROLE_CODE)
  @Permission('system:job:trigger')
  @OperateLog({ type: OpLogType.SYSTEM_JOB, subType: OpLogSub.CLEAN_EXPIRED_TOKEN })
  @ApiOperation({ summary: '（兼容）手动清理过期令牌' })
  async cleanExpiredTokensCompat() {
    const page = await this.jobService.getJobPage({
      page: 1,
      pageSize: 20,
      handlerName: 'system.cleanExpiredTokens',
    });
    const job = page.list[0];
    if (!job) {
      return { access: 0, refresh: 0, code: 0, note: '未找到内置任务，请先迁移种子数据' };
    }
    const result = await this.jobService.triggerJob(job.id);
    return { success: result.success, result: result.result };
  }
}
