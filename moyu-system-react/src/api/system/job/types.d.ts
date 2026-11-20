export interface JobVO {
  id?: number;
  name: string;
  status?: number;
  handlerName: string;
  handlerParam?: string;
  cronExpression: string;
  retryCount: number;
  retryInterval: number;
  monitorTimeout: number;
  remark?: string;
  createTime?: string;
}

