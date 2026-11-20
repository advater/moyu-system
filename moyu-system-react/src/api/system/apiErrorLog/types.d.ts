export interface ApiErrorLogVO {
  id: number;
  traceId?: string;
  userId?: number;
  userType?: number;
  applicationName?: string;
  requestMethod?: string;
  requestParams?: string;
  requestUrl?: string;
  userIp?: string;
  userAgent?: string;
  exceptionTime?: string;
  exceptionName?: string;
  exceptionMessage?: string;
  exceptionStackTrace?: string;
  processUserId?: number;
  processStatus?: number;
  processTime?: string;
  createTime?: string;
}

