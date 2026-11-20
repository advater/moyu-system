import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperateLogController } from './operateLog.controller';
import { OperateLogService } from './operateLog.service';
import { OperateLogRepository } from './repositories/operateLog.repository';
import { OperateLogInterceptor } from '@/common/interceptor/operate-log.interceptor';

/**
 * 操作日志 Module（Global：供 OperateLogInterceptor 注入）
 */
@Global()
@Module({
  controllers: [OperateLogController],
  providers: [
    OperateLogService,
    OperateLogRepository,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperateLogInterceptor,
    },
  ],
  exports: [OperateLogService],
})
export class OperateLogModule {}
