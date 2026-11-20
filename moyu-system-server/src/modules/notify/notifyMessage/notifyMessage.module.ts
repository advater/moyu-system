import { Module } from '@nestjs/common';
import { NotifyMessageController } from './notifyMessage.controller';
import { NotifyMessageService } from './notifyMessage.service';
import { NotifyMessageRepository } from './repositories/notifyMessage.repository';

/**
 * 站内信 Module
 */
@Module({
  controllers: [NotifyMessageController],
  providers: [NotifyMessageService, NotifyMessageRepository],
  exports: [NotifyMessageService, NotifyMessageRepository],
})
export class NotifyMessageModule {}
