import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 用户实体（账号表；个人资料在 sys_user_profile）
 */
export class UserDO extends TenantBaseDO {
  id: number;
  username: string;
  password: string;
  remark?: string | null;
  deptId?: number | null;
  postIds?: number[] | null;
  status: number;
  loginIp?: string | null;
  loginDate?: Date | null;
  passwordUpdateTime?: Date | null;
  mustChangePassword?: boolean;
  /** 权限版本号：赋权/角色变更时递增，旧令牌快照不一致即失效 */
  permVersion: number;
}
