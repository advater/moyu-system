import { Module } from '@nestjs/common';
import { MailLogController } from './mailLog.controller';
import { MailLogService } from './mailLog.service';
import { MailLogRepository } from './repositories/mailLog.repository';

/**
 * 邮件日志 Module
 */
@Module({
  controllers: [MailLogController],
  providers: [MailLogService, MailLogRepository],
  exports: [MailLogService],
})
export class MailLogModule {}
