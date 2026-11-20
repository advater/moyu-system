export interface OperateLogVO {
  id: number;
  traceId?: string;
  userType?: number;
  userId?: number;
  userName?: string;
  type?: string;
  subType?: string;
  bizId?: number;
  action?: string;
  extra?: string;
  requestMethod?: string;
  requestUrl?: string;
  userIp?: string;
  userAgent?: string;
  createTime?: string;
}

