/**
 * 定时任务实体（对应 sys_job，平台级）
 */
export class JobDO {
  id: number;
  name: string;
  status: number;
  handlerName: string;
  handlerParam: string | null;
  cronExpression: string;
  retryCount: number;
  retryInterval: number;
  monitorTimeout: number;
  remark: string | null;
  creator: string | null;
  updater: string | null;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
  deletedAt: Date | null;
}

/**
 * 定时任务执行日志（对应 sys_job_log）
 */
export class JobLogDO {
  id: number;
  jobId: number;
  handlerName: string;
  handlerParam: string | null;
  executeIndex: number;
  beginTime: Date;
  endTime: Date | null;
  duration: number | null;
  status: number;
  result: string | null;
  createTime: Date;
}
