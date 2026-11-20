import { Module } from '@nestjs/common';
import { TenantPackageController } from './tenantPackage.controller';
import { TenantPackageService } from './tenantPackage.service';
import { TenantPackageRepository } from './repositories/tenantPackage.repository';
import { TenantPolicyModule } from '../policy/tenant-policy.module';

/**
 * 租户套餐 Module
 */
@Module({
  imports: [TenantPolicyModule],
  controllers: [TenantPackageController],
  providers: [TenantPackageService, TenantPackageRepository],
  exports: [TenantPackageService],
})
export class TenantPackageModule {}
