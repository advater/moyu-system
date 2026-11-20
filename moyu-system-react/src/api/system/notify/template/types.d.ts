export interface NotifyTemplateVO {
  id?: number;
  name: string;
  nickname: string;
  code: string;
  content: string;
  type?: number;
  params?: string[] | string;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface NotifySendReqVO {
  userId: number;
  userType: number;
  templateCode: string;
  templateParams?: Record<string, any>;
}

