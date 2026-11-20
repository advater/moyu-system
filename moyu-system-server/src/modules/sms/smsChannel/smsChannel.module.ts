import { Module } from '@nestjs/common';
import { SmsChannelController } from './smsChannel.controller';
import { SmsChannelService } from './smsChannel.service';
import { SmsChannelRepository } from './repositories/smsChannel.repository';

/**
 * 短信渠道 Module
 */
@Module({
  controllers: [SmsChannelController],
  providers: [SmsChannelService, SmsChannelRepository],
  exports: [SmsChannelService],
})
export class SmsChannelModule {}
