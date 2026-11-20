export interface MailLogVO {
  id: number;
  userId?: number;
  userType?: number;
  toMails?: string[];
  ccMails?: string[];
  bccMails?: string[];
  accountId?: number;
  fromMail?: string;
  templateId?: number;
  templateCode?: string;
  templateNickname?: string;
  templateTitle?: string;
  templateContent?: string;
  templateParams?: any;
  sendStatus?: number;
  sendTime?: string;
  sendMessageId?: string;
  sendException?: string;
  createTime?: string;
}

