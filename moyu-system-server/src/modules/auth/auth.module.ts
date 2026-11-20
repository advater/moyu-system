import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '@/modules/user/user/user.module';
import { RoleModule } from '@/modules/permission/role/role.module';
import { MenuModule } from '@/modules/permission/menu/menu.module';
import { OAuth2TokenModule } from '@/modules/oauth2/oauth2Token/oauth2Token.module';
import { LoginLogModule } from '@/modules/logger/loginLog/loginLog.module';
import { SmsCallbackModule } from '@/modules/sms/smsCallback/smsCallback.module';
import { SocialClientModule } from '@/modules/social/socialClient/socialClient.module';
import { SocialUserModule } from '@/modules/social/socialUser/socialUser.module';
import { CaptchaModule } from '@/modules/captcha/captcha.module';
import { TenantPolicyModule } from '@/modules/tenant/policy/tenant-policy.module';
import { IpModule } from '@/modules/ip/ip.module';

/**
 * 认证 Module
 */
@Module({
  imports: [
    UserModule,
    RoleModule,
    MenuModule,
    OAuth2TokenModule,
    LoginLogModule,
    SmsCallbackModule,
    SocialClientModule,
    SocialUserModule,
    CaptchaModule,
    TenantPolicyModule,
    IpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
