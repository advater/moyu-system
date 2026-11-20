import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailTemplateController } from './mailTemplate.controller';
import { MailTemplateService } from './mailTemplate.service';
import { MailTemplateRepository } from './repositories/mailTemplate.repository';
import { MailAccountRepository } from '../mailAccount/repositories/mailAccount.repository';
import { MailLogRepository } from '../mailLog/repositories/mailLog.repository';
import { MailSendProcessor } from './mail-send.processor';
import { MAIL_SEND_QUEUE } from '@/config/constants';

/**
 * 邮件模版 Module
 */
@Module({
  imports: [BullModule.registerQueue({ name: MAIL_SEND_QUEUE })],
  controllers: [MailTemplateController],
  providers: [
    MailTemplateService,
    MailTemplateRepository,
    MailAccountRepository,
    MailLogRepository,
    MailSendProcessor,
  ],
  exports: [MailTemplateService],
})
export class MailTemplateModule {}
