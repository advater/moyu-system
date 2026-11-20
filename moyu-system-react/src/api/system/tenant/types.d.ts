export interface TenantVO {
  id?: number;
  name: string;
  contactName: string;
  contactMobile?: string;
  status: number;
  packageId: number;
  username?: string;
  password?: string;
  expireTime: string;
  accountCount: number;
  websites?: string[];
  createTime?: string;
}

