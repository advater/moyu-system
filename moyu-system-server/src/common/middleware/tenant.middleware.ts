import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '@/common/tenant/tenant.context';

/**
 * 租户 AsyncLocalStorage 中间件
 *
 * 为每个 HTTP 请求建立空的租户 store，后续由 TenantGuard / 业务填充。
 */
@Injectable()
export class TenantAsyncMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    TenantContext.run({ tenantId: null, ignore: false }, () => next());
  }
}
