export interface SmsChannelVO {
  id?: number;
  code: string;
  status: number;
  signature: string;
  remark?: string;
  apiKey: string;
  apiSecret?: string;
  callbackUrl?: string;
  createTime?: string;
}

