import { Global, Module } from '@nestjs/common';
import { ApiErrorLogController } from './apiErrorLog.controller';
import { ApiErrorLogService } from './apiErrorLog.service';
import { ApiErrorLogRepository } from './repositories/apiErrorLog.repository';

@Global()
@Module({
  controllers: [ApiErrorLogController],
  providers: [ApiErrorLogService, ApiErrorLogRepository],
  exports: [ApiErrorLogService],
})
export class ApiErrorLogModule {}
