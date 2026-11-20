import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SmsTemplateController } from './smsTemplate.controller';
import { SmsTemplateService } from './smsTemplate.service';
import { SmsTemplateRepository } from './repositories/smsTemplate.repository';
import { SmsChannelRepository } from '../smsChannel/repositories/smsChannel.repository';
import { SmsLogRepository } from '../smsLog/repositories/smsLog.repository';
import { SmsLogModule } from '../smsLog/smsLog.module';
import { SmsSendProcessor } from './sms-send.processor';
import { SMS_SEND_QUEUE } from '@/config/constants';
import { TenantPolicyModule } from '@/modules/tenant/policy/tenant-policy.module';

@Module({
  imports: [
    SmsLogModule,
    TenantPolicyModule,
    BullModule.registerQueue({ name: SMS_SEND_QUEUE }),
  ],
  controllers: [SmsTemplateController],
  providers: [
    SmsTemplateService,
    SmsTemplateRepository,
    SmsChannelRepository,
    SmsLogRepository,
    SmsSendProcessor,
  ],
  exports: [SmsTemplateService],
})
export class SmsTemplateModule {}
