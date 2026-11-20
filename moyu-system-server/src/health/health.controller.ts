import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { SkipAuth } from '@/common/decorator/auth.decorator';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipAuth()
  check() {
    return this.healthService.check();
  }

  /** 进程技术指标：调用耗时分位、异常率（由日志管道采集） */
  @Get('metrics')
  @SkipAuth()
  metrics() {
    return this.healthService.metrics();
  }
}
