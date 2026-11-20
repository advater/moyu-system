import { Module } from '@nestjs/common';
import { JobCoreModule } from './job-core.module';
import { JobLogController } from './job-log.controller';

/**
 * 任务日志独立路由模块（挂载 /admin/job-log）
 */
@Module({
  imports: [JobCoreModule],
  controllers: [JobLogController],
})
export class JobLogModule {}
