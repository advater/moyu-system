export const REQUEST_METRICS_WINDOW_MS = 5 * 60_000;
const MAX_SAMPLES = 4_000;

export interface RequestMetricSample {
  at: number;
  durationMs: number;
  status: number;
}

export interface LatencySnapshot {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export interface RequestMetricsSnapshot {
  uptimeMs: number;
  windowMs: number;
  process: {
    requests: number;
    exceptions: number;
    clientErrors: number;
    exceptionRate: number;
    errorRate: number;
  };
  window: {
    requests: number;
    exceptions: number;
    clientErrors: number;
    exceptionRate: number;
    errorRate: number;
    latencyMs: LatencySnapshot;
  };
}

function ratio(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 10000) / 10000;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function latencyOf(durations: number[]): LatencySnapshot {
  const sorted = [...durations].sort((a, b) => a - b);
  return {
    avg: avg(sorted),
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

/**
 * 进程内请求技术指标（滑动窗口）
 * - exception：HTTP 5xx
 * - clientError：HTTP 4xx
 */
export class RequestMetrics {
  private readonly startedAt = Date.now();
  private samples: RequestMetricSample[] = [];
  private totalRequests = 0;
  private totalExceptions = 0;
  private totalClientErrors = 0;

  observe(status: number, durationMs: number): void {
    const safeStatus = Number.isFinite(status) ? status : 0;
    const safeDuration = Number.isFinite(durationMs)
      ? Math.max(0, durationMs)
      : 0;
    this.totalRequests += 1;
    if (safeStatus >= 500) this.totalExceptions += 1;
    else if (safeStatus >= 400) this.totalClientErrors += 1;

    this.samples.push({
      at: Date.now(),
      durationMs: safeDuration,
      status: safeStatus,
    });
    this.prune(Date.now());
  }

  snapshot(): RequestMetricsSnapshot {
    const now = Date.now();
    this.prune(now);
    const window = this.samples;
    const exceptions = window.filter((s) => s.status >= 500).length;
    const clientErrors = window.filter(
      (s) => s.status >= 400 && s.status < 500,
    ).length;
    const requests = window.length;

    return {
      uptimeMs: now - this.startedAt,
      windowMs: REQUEST_METRICS_WINDOW_MS,
      process: {
        requests: this.totalRequests,
        exceptions: this.totalExceptions,
        clientErrors: this.totalClientErrors,
        exceptionRate: ratio(this.totalExceptions, this.totalRequests),
        errorRate: ratio(
          this.totalExceptions + this.totalClientErrors,
          this.totalRequests,
        ),
      },
      window: {
        requests,
        exceptions,
        clientErrors,
        exceptionRate: ratio(exceptions, requests),
        errorRate: ratio(exceptions + clientErrors, requests),
        latencyMs: latencyOf(window.map((s) => s.durationMs)),
      },
    };
  }

  reset(): void {
    this.samples = [];
    this.totalRequests = 0;
    this.totalExceptions = 0;
    this.totalClientErrors = 0;
  }

  private prune(now: number): void {
    const cutoff = now - REQUEST_METRICS_WINDOW_MS;
    if (this.samples.length > MAX_SAMPLES) {
      this.samples = this.samples.slice(this.samples.length - MAX_SAMPLES);
    }
    if (this.samples.length && this.samples[0].at < cutoff) {
      this.samples = this.samples.filter((s) => s.at >= cutoff);
    }
  }
}
