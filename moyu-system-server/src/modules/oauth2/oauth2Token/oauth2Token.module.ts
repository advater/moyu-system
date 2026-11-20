import { Module } from '@nestjs/common';
import { OAuth2TokenController } from './oauth2Token.controller';
import { OAuth2TokenService } from './oauth2Token.service';
import { OAuth2TokenRepository } from './repositories/oauth2AccessToken.repository';
import { OAuth2RefreshTokenRepository } from './repositories/oauth2RefreshToken.repository';
import { TenantPolicyModule } from '@/modules/tenant/policy/tenant-policy.module';
import { UserModule } from '@/modules/user/user/user.module';

@Module({
  imports: [TenantPolicyModule, UserModule],
  controllers: [OAuth2TokenController],
  providers: [
    OAuth2TokenService,
    OAuth2TokenRepository,
    OAuth2RefreshTokenRepository,
  ],
  exports: [OAuth2TokenService],
})
export class OAuth2TokenModule {}
