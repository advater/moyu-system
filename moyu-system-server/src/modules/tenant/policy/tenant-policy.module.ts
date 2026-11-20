import { Module } from '@nestjs/common';
import { TenantPolicyService } from './tenant-policy.service';
import { TenantRepository } from '../tenant/repositories/tenant.repository';
import { RoleModule } from '@/modules/permission/role/role.module';

/**
 * 租户策略共享模块（无控制器）
 * 供 Auth / User / Tenant / TenantPackage 注入，避免 Tenant ↔ User 循环依赖
 */
@Module({
  imports: [RoleModule],
  providers: [TenantRepository, TenantPolicyService],
  exports: [TenantRepository, TenantPolicyService],
})
export class TenantPolicyModule {}
