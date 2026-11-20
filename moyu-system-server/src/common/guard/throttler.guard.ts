import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { PUBLIC_PATHS } from '@/config/constants';

export { ThrottlerGuard };

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

function headerValue(req: Record<string, any>, name: string): string {
  const raw = req.headers?.[name];
  if (Array.isArray(raw)) return String(raw[0] || '');
  return typeof raw === 'string' ? raw : '';
}

/**
 * 自定义限流守卫
 * - 非 HTTP（WS）/ 公共路径跳过
 * - 开发环境回环地址跳过，避免本地刷新、HMR 误伤
 * - 已登录按租户+用户；未登录按真实客户端 IP
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url = String(request.url || request.raw?.url || '');
    if (PUBLIC_PATHS.some((path) => url.startsWith(path))) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      const ip = this.resolveClientIp(request);
      if (LOOPBACK.has(ip)) {
        return true;
      }
    }

    return false;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.loginUser ?? req.user;
    if (user?.id != null) {
      return `t:${user.tenantId ?? user.tenant_id ?? 'x'}:u:${user.id}`;
    }
    return this.resolveClientIp(req);
  }

  private resolveClientIp(req: Record<string, any>): string {
    const forwarded = headerValue(req, 'x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = headerValue(req, 'x-real-ip');
    if (realIp) {
      return realIp;
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('请求过于频繁，请稍后再试');
  }
}
