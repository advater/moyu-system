export interface SmsTemplateVO {
  id?: number;
  type?: number;
  status: number;
  code: string;
  name: string;
  content: string;
  remark?: string;
  apiTemplateId: string;
  channelId?: number;
  channelCode?: string;
  params?: string[];
  createTime?: string;
}

export interface SendSmsReqVO {
  mobile: string;
  templateCode: string;
  templateParams?: Record<string, any>;
}

