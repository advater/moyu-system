import { Module } from '@nestjs/common';
import { SystemJobService } from './system-job.service';
import { JobService } from './job.service';
import { JobSchedulerService } from './job-scheduler.service';
import {
  JobRepository,
  JobLogRepository,
} from './repositories/job.repository';
import { NoticeModule } from '@/modules/notice/notice.module';

/**
 * 定时任务核心（无 Controller，供 Job / JobLog 路由模块复用）
 */
@Module({
  imports: [NoticeModule],
  providers: [
    SystemJobService,
    JobService,
    JobSchedulerService,
    JobRepository,
    JobLogRepository,
  ],
  exports: [SystemJobService, JobService, JobSchedulerService],
})
export class JobCoreModule {}
