export interface ApiAccessLogVO {
  id: number;
  traceId?: string;
  userId?: number;
  userType?: number;
  applicationName?: string;
  requestMethod?: string;
  requestParams?: string;
  responseBody?: string;
  requestUrl?: string;
  userIp?: string;
  userAgent?: string;
  operateModule?: string;
  operateName?: string;
  beginTime?: string;
  endTime?: string;
  duration?: number;
  resultCode?: number;
  resultMsg?: string;
  createTime?: string;
}

