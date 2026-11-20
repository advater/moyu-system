import { RequestMetrics } from './request-metrics';

describe('RequestMetrics', () => {
  let metrics: RequestMetrics;

  beforeEach(() => {
    metrics = new RequestMetrics();
  });

  it('computes exception rate and latency percentiles', () => {
    metrics.observe(200, 10);
    metrics.observe(200, 20);
    metrics.observe(500, 40);
    metrics.observe(404, 5);

    const snap = metrics.snapshot();
    expect(snap.process.requests).toBe(4);
    expect(snap.process.exceptions).toBe(1);
    expect(snap.process.clientErrors).toBe(1);
    expect(snap.process.exceptionRate).toBe(0.25);
    expect(snap.process.errorRate).toBe(0.5);
    expect(snap.window.requests).toBe(4);
    expect(snap.window.exceptionRate).toBe(0.25);
    expect(snap.window.latencyMs.max).toBe(40);
    expect(snap.window.latencyMs.p50).toBeGreaterThan(0);
    expect(snap.window.latencyMs.avg).toBe(19);
  });

  it('returns zero rates when idle', () => {
    const snap = metrics.snapshot();
    expect(snap.process.exceptionRate).toBe(0);
    expect(snap.window.latencyMs.avg).toBe(0);
  });
});
