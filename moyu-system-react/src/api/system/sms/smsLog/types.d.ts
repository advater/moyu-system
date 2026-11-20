export interface SmsLogVO {
  id?: number;
  channelId?: number;
  channelCode?: string;
  templateId?: number;
  templateCode?: string;
  templateType?: number;
  templateContent?: string;
  templateParams?: Record<string, any>;
  apiTemplateId?: string;
  mobile?: string;
  userId?: number;
  userType?: number;
  sendStatus?: number;
  sendTime?: string;
  apiSendCode?: string;
  apiSendMsg?: string;
  receiveStatus?: number;
  receiveTime?: string;
  createTime?: string;
}

