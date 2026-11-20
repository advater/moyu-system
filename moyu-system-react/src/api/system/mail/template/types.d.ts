export interface MailTemplateVO {
  id?: number;
  name: string;
  code: string;
  accountId: number;
  nickname?: string;
  title: string;
  content: string;
  status: number;
  remark?: string;
  params?: string[];
  createTime?: string;
}

export interface MailSendReqVO {
  toMails: string[];
  ccMails?: string[];
  bccMails?: string[];
  templateCode: string;
  templateParams?: Record<string, any>;
}

