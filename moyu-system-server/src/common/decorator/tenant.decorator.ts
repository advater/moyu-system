import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID } from '@/config/constants';

/**
 * 注入当前请求租户编号（优先 ALS，其次 loginUser.tenantId，最后默认租户）
 */
export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const fromAls = TenantContext.getTenantId();
    if (fromAls) return fromAls;
    const req = ctx.switchToHttp().getRequest();
    const user = req?.loginUser ?? req?.user;
    return user?.tenantId || DEFAULT_TENANT_ID;
  },
);
