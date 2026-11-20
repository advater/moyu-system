import { Module } from '@nestjs/common';
import { NotifyTemplateController } from './notifyTemplate.controller';
import { NotifyTemplateService } from './notifyTemplate.service';
import { NotifyTemplateRepository } from './repositories/notifyTemplate.repository';
import { NotifyMessageModule } from '../notifyMessage/notifyMessage.module';
import { NoticeModule } from '@/modules/notice/notice.module';

@Module({
  imports: [NotifyMessageModule, NoticeModule],
  controllers: [NotifyTemplateController],
  providers: [NotifyTemplateService, NotifyTemplateRepository],
  exports: [NotifyTemplateService],
})
export class NotifyTemplateModule {}
