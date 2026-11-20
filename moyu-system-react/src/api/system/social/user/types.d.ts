export interface SocialUserVO {
  id: number;
  type?: number;
  openid?: string;
  token?: string;
  rawTokenInfo?: string;
  nickname?: string;
  avatar?: string;
  rawUserInfo?: string;
  code?: string;
  state?: string;
  createTime?: string;
}

