export class ApiAccessLogDO {
  id: number;
  tenantId: string;
  traceId: string | null;
  userId: number;
  userType: number;
  applicationName: string;
  requestMethod: string;
  requestUrl: string;
  requestParams: string | null;
  responseBody: string | null;
  userIp: string | null;
  userAgent: string | null;
  operateModule: string | null;
  operateName: string | null;
  operateType: number;
  beginTime: Date;
  endTime: Date;
  duration: number;
  resultCode: number;
  resultMsg: string | null;
  createTime: Date;
}

export class ApiErrorLogDO {
  id: number;
  tenantId: string;
  traceId: string | null;
  userId: number;
  userType: number;
  applicationName: string;
  requestMethod: string;
  requestUrl: string;
  requestParams: string | null;
  userIp: string | null;
  userAgent: string | null;
  exceptionTime: Date;
  exceptionName: string;
  exceptionMessage: string | null;
  exceptionRootCauseMessage: string | null;
  exceptionStackTrace: string | null;
  exceptionClassName: string | null;
  exceptionFileName: string | null;
  exceptionMethodName: string | null;
  exceptionLineNumber: number | null;
  processStatus: number;
  processTime: Date | null;
  processUserId: number | null;
  createTime: Date;
}
