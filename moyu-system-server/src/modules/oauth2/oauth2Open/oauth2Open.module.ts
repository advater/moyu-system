import { Module } from '@nestjs/common';
import { OAuth2OpenController } from './oauth2Open.controller';
import { OAuth2OpenService } from './oauth2Open.service';
import { OAuth2CodeRepository } from './repositories/oauth2Code.repository';
import { OAuth2ApproveRepository } from './repositories/oauth2Approve.repository';
import { OAuth2ClientModule } from '@/modules/oauth2/oauth2Client/oauth2Client.module';
import { OAuth2TokenModule } from '@/modules/oauth2/oauth2Token/oauth2Token.module';
import { UserModule } from '@/modules/user/user/user.module';

/**
 * OAuth2 授权 Module
 *
 * Client / AccessToken 复用 oauth2Client、oauth2Token 模块；
 * 本模块仅保留授权码与用户授权记录（Code / Approve）。
 */
@Module({
  imports: [OAuth2ClientModule, OAuth2TokenModule, UserModule],
  controllers: [OAuth2OpenController],
  providers: [OAuth2OpenService, OAuth2CodeRepository, OAuth2ApproveRepository],
  exports: [OAuth2OpenService],
})
export class OAuth2OpenModule {}
