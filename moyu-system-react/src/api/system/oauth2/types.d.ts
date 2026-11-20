export interface OAuth2ClientVO {
  id?: number;
  clientId: string;
  secret?: string;
  name: string;
  logo: string;
  description?: string;
  status: number;
  accessTokenValiditySeconds: number;
  refreshTokenValiditySeconds: number;
  redirectUris?: string[];
  autoApprove?: boolean;
  authorizedGrantTypes: string[];
  scopes?: string[];
  autoApproveScopes?: string[];
  authorities?: string[];
  resourceIds?: string[];
  additionalInformation?: string;
  createTime?: string;
}

export interface OAuth2TokenVO {
  id: number;
  accessToken: string;
  refreshToken?: string;
  userId?: number;
  userType?: number;
  clientId?: string;
  createTime?: string;
  expiresTime?: string;
}

