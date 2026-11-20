import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 通知公告表
 */
export class NoticeDO extends TenantBaseDO {
  /**
   * 通知公告ID 自增主键
   */
  id: number;
  /**
   * 公告标题
   */
  title: string;
  /**
   * 公告类型
   *
   * 枚举 {@link NoticeTypeEnum}
   */
  type: number;
  /**
   * 公告内容
   */
  content: string;
  /**
   * 公告状态
   *
   * 枚举 {@link CommonStatusEnum}
   */
  status: number;
  targetDeptIds?: number[] | null;
  targetRoleIds?: number[] | null;
  publishTime?: Date | null;
}
