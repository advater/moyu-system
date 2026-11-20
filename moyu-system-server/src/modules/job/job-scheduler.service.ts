import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { JobRepository, JobLogRepository } from './repositories/job.repository';
import { SystemJobService } from './system-job.service';
import { JobDO } from './entities/job.entity';

type JobHandler = (param?: string | null) => Promise<string | void>;

/**
 * 动态注册 / 启停 Cron，并写执行日志
 */
@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly jobRepository: JobRepository,
    private readonly jobLogRepository: JobLogRepository,
    private readonly systemJobService: SystemJobService,
  ) {
    this.handlers.set('system.cleanExpiredTokens', () =>
      this.systemJobService.cleanExpiredTokens(),
    );
    this.handlers.set('system.cleanOldLogs', () =>
      this.systemJobService.cleanOldLogs(),
    );
    this.handlers.set('system.publishDueNotices', () =>
      this.systemJobService.publishDueNotices(),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      const jobs = await this.jobRepository.selectEnabledList();
      for (const job of jobs) {
        this.scheduleJob(job);
      }
      this.logger.log(`已加载 ${jobs.length} 个启用中的定时任务`);
    } catch (err) {
      this.logger.warn(
        `加载定时任务失败（表可能未迁移）: ${(err as Error).message}`,
      );
    }
  }

  hasHandler(handlerName: string): boolean {
    return this.handlers.has(handlerName);
  }

  listHandlerNames(): string[] {
    return [...this.handlers.keys()];
  }

  /** 校验 cron；非法则抛错 */
  assertCronValid(expression: string): void {
    try {
      const job = new CronJob(expression, () => {});
      job.stop();
    } catch {
      throw new Error('INVALID_CRON');
    }
  }

  cronName(jobId: number): string {
    return `sys-job-${jobId}`;
  }

  scheduleJob(job: JobDO): void {
    this.unscheduleJob(job.id);
    if (job.status !== 1) return;
    if (!this.handlers.has(job.handlerName)) {
      this.logger.warn(`跳过未知处理器: ${job.handlerName} (job#${job.id})`);
      return;
    }
    try {
      const cronJob = new CronJob(job.cronExpression, () => {
        void this.executeJob(job.id);
      });
      this.schedulerRegistry.addCronJob(this.cronName(job.id), cronJob);
      cronJob.start();
    } catch (err) {
      this.logger.error(
        `注册任务失败 job#${job.id}: ${(err as Error).message}`,
      );
    }
  }

  unscheduleJob(jobId: number): void {
    const name = this.cronName(jobId);
    try {
      if (this.schedulerRegistry.doesExist('cron', name)) {
        this.schedulerRegistry.deleteCronJob(name);
      }
    } catch {
      // ignore
    }
  }

  /**
   * 执行一次任务（含重试），写 job_log
   */
  async executeJob(jobId: number): Promise<{ success: boolean; result: string }> {
    const job = await this.jobRepository.selectById(jobId);
    if (!job || job.deleted) {
      return { success: false, result: '任务不存在' };
    }
    const handler = this.handlers.get(job.handlerName);
    if (!handler) {
      return { success: false, result: '未知处理器' };
    }

    const maxAttempts = Math.max(1, (job.retryCount ?? 0) + 1);
    let lastError = '';
    for (let i = 1; i <= maxAttempts; i++) {
      const beginTime = new Date();
      const logId = await this.jobLogRepository.insert({
        jobId: job.id,
        handlerName: job.handlerName,
        handlerParam: job.handlerParam,
        executeIndex: i,
        beginTime,
        status: 0,
      });
      try {
        const raw = await handler(job.handlerParam);
        const endTime = new Date();
        const result =
          typeof raw === 'string' ? raw.slice(0, 4000) : 'OK';
        await this.jobLogRepository.updateById(logId, {
          endTime,
          duration: endTime.getTime() - beginTime.getTime(),
          status: 0,
          result,
        });
        return { success: true, result };
      } catch (err) {
        lastError = (err as Error).message || String(err);
        const endTime = new Date();
        await this.jobLogRepository.updateById(logId, {
          endTime,
          duration: endTime.getTime() - beginTime.getTime(),
          status: 1,
          result: lastError.slice(0, 4000),
        });
        if (i < maxAttempts && job.retryInterval > 0) {
          await new Promise((r) =>
            setTimeout(r, job.retryInterval * 1000),
          );
        }
      }
    }
    return { success: false, result: lastError || '执行失败' };
  }
}
