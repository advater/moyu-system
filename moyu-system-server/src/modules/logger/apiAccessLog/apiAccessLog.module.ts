import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiAccessLogController } from './apiAccessLog.controller';
import { ApiAccessLogService } from './apiAccessLog.service';
import { ApiAccessLogRepository } from './repositories/apiAccessLog.repository';
import { ApiAccessLogInterceptor } from '@/common/interceptor/api-access-log.interceptor';
import { ApiErrorLogModule } from '@/modules/logger/apiErrorLog/apiErrorLog.module';

@Global()
@Module({
  imports: [ApiErrorLogModule],
  controllers: [ApiAccessLogController],
  providers: [
    ApiAccessLogService,
    ApiAccessLogRepository,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiAccessLogInterceptor,
    },
  ],
  exports: [ApiAccessLogService],
})
export class ApiAccessLogModule {}
