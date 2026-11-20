export interface LoginLogVO {
  id: number;
  logType: number;
  traceId?: number | string;
  userId?: number;
  userType: number;
  username: string;
  result: number;
  status?: number;
  userIp: string;
  location?: string;
  userAgent?: string;
  createTime: string;
}

