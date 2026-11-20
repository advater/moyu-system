import { Module } from '@nestjs/common';
import { SocialClientController } from './socialClient.controller';
import { SocialClientService } from './socialClient.service';
import { SocialClientRepository } from './repositories/socialClient.repository';

/**
 * 社交客户端 Module
 */
@Module({
  controllers: [SocialClientController],
  providers: [SocialClientService, SocialClientRepository],
  exports: [SocialClientService, SocialClientRepository],
})
export class SocialClientModule {}
