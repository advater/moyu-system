import { Global, Module, forwardRef } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { DataScopeService } from './data-scope.service';
import { RoleModule } from '../role/role.module';
import { MenuModule } from '../menu/menu.module';
import { UserModule } from '../../user/user/user.module';
import { DeptModule } from '../../dept/dept/dept.module';

/**
 * 权限分配 Module（Global：供 APP_GUARD / 数据权限注入）
 */
@Global()
@Module({
  imports: [
    RoleModule,
    MenuModule,
    forwardRef(() => UserModule),
    forwardRef(() => DeptModule),
  ],
  controllers: [PermissionController],
  providers: [PermissionService, DataScopeService],
  exports: [PermissionService, DataScopeService],
})
export class PermissionModule {}
