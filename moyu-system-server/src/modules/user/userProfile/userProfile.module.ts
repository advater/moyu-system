import { Module } from '@nestjs/common';
import { UserProfileController } from './userProfile.controller';
import { UserProfileService } from './userProfile.service';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../../permission/role/role.module';
import { DeptModule } from '../../dept/dept/dept.module';
import { PostModule } from '../../dept/post/post.module';
import { FileModule } from '@/modules/file/file.module';

/**
 * 用户信息 Module
 */
@Module({
  imports: [UserModule, RoleModule, DeptModule, PostModule, FileModule],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
