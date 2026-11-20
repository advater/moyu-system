export interface SocialClientVO {
  id?: number;
  name: string;
  socialType: number;
  userType: number;
  clientId: string;
  clientSecret?: string;
  agentId?: string;
  publicKey?: string;
  status: number;
  createTime?: string;
}

