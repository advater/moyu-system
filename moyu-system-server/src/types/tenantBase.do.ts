import { BaseDO } from "@/types/base.do";

/**
 * 多租户基础数据对象
 */
export class TenantBaseDO extends BaseDO {
  /**
   * 多租户编号
   */
  tenantId: string;
}
