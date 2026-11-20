import { Module } from '@nestjs/common';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NoticeRepository } from './repositories/notice.repository';
import { NoticeWsGateway } from './notice-ws.gateway';
import { OAuth2TokenModule } from '@/modules/oauth2/oauth2Token/oauth2Token.module';

/**
 * 通知公告 Module
 */
@Module({
  imports: [OAuth2TokenModule],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository, NoticeWsGateway],
  exports: [NoticeService, NoticeWsGateway],
})
export class NoticeModule {}
