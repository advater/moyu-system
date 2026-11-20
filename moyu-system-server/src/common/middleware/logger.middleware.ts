/**
 * 请求日志中间件 — 记录调用耗时，并采集技术指标 / 异常率
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@/plugins/logger/logger.service';
import { sanitizeBody, sanitizeHeaders } from '@/utils/sanitize';
import { RequestMetricsService } from '@/common/metrics/request-metrics.service';
import { REQ_STARTED_AT_KEY } from '@/common/logger/persist-api-error-log';

const SKIP_METRIC_PREFIXES = ['/health', '/api-docs', '/favicon'];

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: RequestMetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    (req as Request & { [REQ_STARTED_AT_KEY]?: number })[REQ_STARTED_AT_KEY] =
      startedAt;

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const { method, originalUrl, url, query } = req;
      const path = originalUrl || url || '';
      const status = res.statusCode;

      this.logger.info({
        message: 'Request',
        method,
        url: path,
        status,
        durationMs,
        query,
        body: sanitizeBody(req.body as Record<string, any>),
        headers: sanitizeHeaders(req.headers as Record<string, any>),
      });

      if (!SKIP_METRIC_PREFIXES.some((p) => path.startsWith(p))) {
        this.metrics.observe(status, durationMs);
      }
    });
    next();
  }
}
