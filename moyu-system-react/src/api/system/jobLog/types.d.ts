export interface JobLogVO {
  id: number;
  jobId: number;
  handlerName?: string;
  handlerParam?: string;
  executeIndex?: number;
  beginTime?: string;
  endTime?: string;
  duration?: number;
  status?: number;
  result?: string;
  createTime?: string;
}

