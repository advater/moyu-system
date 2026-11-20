import { Module } from '@nestjs/common';
import { OAuth2ClientController } from './oauth2Client.controller';
import { OAuth2ClientService } from './oauth2Client.service';
import { OAuth2ClientRepository } from './repositories/oauth2Client.repository';

/**
 * OAuth2 客户端 Module
 */
@Module({
  controllers: [OAuth2ClientController],
  providers: [OAuth2ClientService, OAuth2ClientRepository],
  exports: [OAuth2ClientService],
})
export class OAuth2ClientModule {}
