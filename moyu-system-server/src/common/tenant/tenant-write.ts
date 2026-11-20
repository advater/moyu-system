import { TenantContext } from '@/common/tenant/tenant.context';

/** 创建入参可省略 tenantId，由上下文自动补齐 */
export type TenantCreateInput<T extends { tenantId: string }> = Omit<
  T,
  'tenantId'
> & { tenantId?: string };

/**
 * 写入前补齐 tenantId（显式传入优先，否则取 ALS 上下文；无上下文则抛错，禁止默写租户 0）
 */
export function ensureTenantId<T extends object>(
  data: T & { tenantId?: string },
): T & { tenantId: string } {
  const explicit = (data as { tenantId?: string }).tenantId?.trim();
  const tenantId = explicit || TenantContext.requireTenantId();
  return { ...data, tenantId };
}
