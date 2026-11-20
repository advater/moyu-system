import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  JobLogPageReqDTO,
  JobLogResDTO,
  JobPageReqDTO,
  JobResDTO,
  JobSaveReqDTO,
  JobUpdateStatusReqDTO,
} from './dto/job.dto';
import { JobRepository, JobLogRepository } from './repositories/job.repository';
import { JobSchedulerService } from './job-scheduler.service';
import { JobDO, JobLogDO } from './entities/job.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, JobError } from '@/config/error-messages';

@Injectable()
export class JobService {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobLogRepository: JobLogRepository,
    private readonly jobScheduler: JobSchedulerService,
  ) {}

  async createJob(req: JobSaveReqDTO): Promise<number> {
    this.validateHandlerAndCron(req.handlerName, req.cronExpression);
    const exists = await this.jobRepository.selectByName(req.name);
    if (exists) {
      throw new HttpException(JobError.NAME_EXISTS, HttpStatus.BAD_REQUEST);
    }
    const id = await this.jobRepository.insert({
      name: req.name,
      status: 1,
      handlerName: req.handlerName,
      handlerParam: req.handlerParam ?? null,
      cronExpression: req.cronExpression,
      retryCount: req.retryCount ?? 0,
      retryInterval: req.retryInterval ?? 0,
      monitorTimeout: req.monitorTimeout ?? 0,
      remark: req.remark ?? null,
    });
    const job = await this.jobRepository.selectById(id);
    if (job) this.jobScheduler.scheduleJob(job);
    return id;
  }

  async updateJob(req: JobSaveReqDTO): Promise<boolean> {
    if (req.id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    this.validateHandlerAndCron(req.handlerName, req.cronExpression);
    const existing = await this.jobRepository.selectById(req.id);
    if (!existing) {
      throw new HttpException(JobError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const sameName = await this.jobRepository.selectByName(req.name);
    if (sameName && sameName.id !== req.id) {
      throw new HttpException(JobError.NAME_EXISTS, HttpStatus.BAD_REQUEST);
    }
    await this.jobRepository.updateById(req.id, {
      name: req.name,
      handlerName: req.handlerName,
      handlerParam: req.handlerParam ?? null,
      cronExpression: req.cronExpression,
      retryCount: req.retryCount ?? 0,
      retryInterval: req.retryInterval ?? 0,
      monitorTimeout: req.monitorTimeout ?? 0,
      remark: req.remark ?? null,
    });
    const job = await this.jobRepository.selectById(req.id);
    if (job) this.jobScheduler.scheduleJob(job);
    return true;
  }

  async updateJobStatus(req: JobUpdateStatusReqDTO): Promise<boolean> {
    const existing = await this.jobRepository.selectById(req.id);
    if (!existing) {
      throw new HttpException(JobError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (req.status !== 0 && req.status !== 1) {
      throw new HttpException(JobError.STATUS_INVALID, HttpStatus.BAD_REQUEST);
    }
    await this.jobRepository.updateById(req.id, { status: req.status });
    const job = await this.jobRepository.selectById(req.id);
    if (job) this.jobScheduler.scheduleJob(job);
    return true;
  }

  async deleteJob(id: number): Promise<boolean> {
    const existing = await this.jobRepository.selectById(id);
    if (!existing) {
      throw new HttpException(JobError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    this.jobScheduler.unscheduleJob(id);
    return this.jobRepository.deleteById(id);
  }

  async getJob(id: number): Promise<JobResDTO> {
    const job = await this.jobRepository.selectById(id);
    if (!job) {
      throw new HttpException(JobError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResp(job);
  }

  async getJobPage(query: JobPageReqDTO): Promise<PageResult<JobResDTO>> {
    const where: Prisma.SysJobWhereInput = {};
    if (query.name) where.name = { contains: query.name };
    if (query.handlerName) where.handlerName = { contains: query.handlerName };
    if (query.status !== undefined && query.status !== null) {
      where.status = query.status;
    }
    const { list, total } = await this.jobRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return {
      list: list.map((j) => this.toResp(j)),
      total,
    };
  }

  async triggerJob(id: number): Promise<{ success: boolean; result: string }> {
    const job = await this.jobRepository.selectById(id);
    if (!job) {
      throw new HttpException(JobError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.jobScheduler.executeJob(id);
  }

  listHandlers(): string[] {
    return this.jobScheduler.listHandlerNames();
  }

  async getJobLog(id: number): Promise<JobLogResDTO> {
    const log = await this.jobLogRepository.selectById(id);
    if (!log) {
      throw new HttpException(JobError.LOG_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toLogResp(log);
  }

  async getJobLogPage(
    query: JobLogPageReqDTO,
  ): Promise<PageResult<JobLogResDTO>> {
    const where: Prisma.SysJobLogWhereInput = {};
    if (query.jobId !== undefined && query.jobId !== null) {
      where.jobId = query.jobId;
    }
    if (query.handlerName) where.handlerName = { contains: query.handlerName };
    if (query.status !== undefined && query.status !== null) {
      where.status = query.status;
    }
    const { list, total } = await this.jobLogRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return {
      list: list.map((l) => this.toLogResp(l)),
      total,
    };
  }

  private validateHandlerAndCron(handlerName: string, cron: string): void {
    if (!this.jobScheduler.hasHandler(handlerName)) {
      throw new HttpException(
        JobError.HANDLER_UNKNOWN,
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      this.jobScheduler.assertCronValid(cron);
    } catch {
      throw new HttpException(JobError.CRON_INVALID, HttpStatus.BAD_REQUEST);
    }
  }

  private toResp(job: JobDO): JobResDTO {
    return {
      id: job.id,
      name: job.name,
      status: job.status,
      handlerName: job.handlerName,
      handlerParam: job.handlerParam ?? undefined,
      cronExpression: job.cronExpression,
      retryCount: job.retryCount,
      retryInterval: job.retryInterval,
      monitorTimeout: job.monitorTimeout,
      remark: job.remark ?? undefined,
      createTime: formatDate(job.createTime),
    };
  }

  private toLogResp(log: JobLogDO): JobLogResDTO {
    return {
      id: log.id,
      jobId: log.jobId,
      handlerName: log.handlerName,
      handlerParam: log.handlerParam ?? undefined,
      executeIndex: log.executeIndex,
      beginTime: formatDate(log.beginTime),
      endTime: log.endTime ? formatDate(log.endTime) : undefined,
      duration: log.duration ?? undefined,
      status: log.status,
      result: log.result ?? undefined,
      createTime: formatDate(log.createTime),
    };
  }
}
