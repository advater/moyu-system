export interface NotifyMessageVO {
  id: number;
  userId?: number;
  userType?: number;
  templateId?: number;
  templateCode?: string;
  templateNickname?: string;
  templateContent?: string;
  templateType?: number;
  templateParams?: any;
  readStatus?: boolean;
  readTime?: string;
  createTime?: string;
}

