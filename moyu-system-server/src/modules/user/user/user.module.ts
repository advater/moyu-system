import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserPasswordService } from './user-password.service';
import { UserRepository } from './repositories/user.repository';
import { UserProfileRepository } from '../userProfile/repositories/userProfile.repository';
import { DeptModule } from '../../dept/dept/dept.module';
import { PostModule } from '../../dept/post/post.module';
import { TenantPolicyModule } from '@/modules/tenant/policy/tenant-policy.module';

/**
 * 用户管理 Module
 */
@Module({
  imports: [DeptModule, PostModule, TenantPolicyModule],
  controllers: [UserController],
  providers: [UserService, UserPasswordService, UserRepository, UserProfileRepository],
  exports: [UserService, UserPasswordService, UserRepository, UserProfileRepository],
})
export class UserModule {}
