import { Module } from '@nestjs/common';
import { SmsLogController } from './smsLog.controller';
import { SmsLogService } from './smsLog.service';
import { SmsLogRepository } from './repositories/smsLog.repository';

/**
 * 短信日志 Module
 */
@Module({
  controllers: [SmsLogController],
  providers: [SmsLogService, SmsLogRepository],
  exports: [SmsLogService],
})
export class SmsLogModule {}
