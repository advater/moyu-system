import { Module } from '@nestjs/common';
import { RedisModule } from '@/plugins/redis/redis.module';
import { SmsCallbackController } from './smsCallback.controller';
import { SmsCallbackService } from './smsCallback.service';
import { SmsCodeRepository } from './repositories/smsCode.repository';
import { SmsTemplateModule } from '../smsTemplate/smsTemplate.module';
import { SmsLogModule } from '../smsLog/smsLog.module';

/**
 * 短信回调 Module
 */
@Module({
  imports: [RedisModule, SmsTemplateModule, SmsLogModule],
  controllers: [SmsCallbackController],
  providers: [SmsCallbackService, SmsCodeRepository],
  exports: [SmsCallbackService],
})
export class SmsCallbackModule {}
