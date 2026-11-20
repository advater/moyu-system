import { Module } from '@nestjs/common';
import { SocialUserController } from './socialUser.controller';
import { SocialUserService } from './socialUser.service';
import { SocialUserRepository } from './repositories/socialUser.repository';
import { SocialUserBindRepository } from './repositories/socialUserBind.repository';
import { SocialClientModule } from '../socialClient/socialClient.module';

/**
 * 社交用户 Module
 */
@Module({
  imports: [SocialClientModule],
  controllers: [SocialUserController],
  providers: [
    SocialUserService,
    SocialUserRepository,
    SocialUserBindRepository,
  ],
  exports: [SocialUserService],
})
export class SocialUserModule {}
