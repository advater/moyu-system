import { Module } from '@nestjs/common';
import { UserProfileModule } from '@/modules/user/userProfile/userProfile.module';
import { OAuth2UserController } from './oauth2User.controller';
import { OAuth2UserService } from './oauth2User.service';

/**
 * OAuth2 用户 Module
 */
@Module({
  imports: [UserProfileModule],
  controllers: [OAuth2UserController],
  providers: [OAuth2UserService],
  exports: [OAuth2UserService],
})
export class OAuth2UserModule {}
