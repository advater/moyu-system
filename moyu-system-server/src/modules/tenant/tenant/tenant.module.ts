import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { UserModule } from '@/modules/user/user/user.module';
import { RoleModule } from '@/modules/permission/role/role.module';
import { TenantPackageModule } from '../tenantPackage/tenantPackage.module';
import { CaptchaModule } from '@/modules/captcha/captcha.module';
import { TenantPolicyModule } from '../policy/tenant-policy.module';

/**
 * 租户 Module
 */
@Module({
  imports: [
    UserModule,
    RoleModule,
    TenantPackageModule,
    CaptchaModule,
    TenantPolicyModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService, TenantPolicyModule],
})
export class TenantModule {}
