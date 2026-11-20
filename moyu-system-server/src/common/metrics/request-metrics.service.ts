import { Injectable } from '@nestjs/common';
import { RequestMetrics } from './request-metrics';

@Injectable()
export class RequestMetricsService extends RequestMetrics {}

export type { RequestMetricsSnapshot } from './request-metrics';
