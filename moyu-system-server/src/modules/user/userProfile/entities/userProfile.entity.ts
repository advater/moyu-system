import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 用户个人资料实体（独立表 sys_user_profile）
 */
export class UserProfileDO extends TenantBaseDO {
  id: number;
  userId: number;
  nickname?: string | null;
  email?: string | null;
  mobile?: string | null;
  sex?: number | null;
  avatar?: string | null;
}
