import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleRepository } from './repositories/role.repository';
import { RoleMenuRepository } from './repositories/roleMenu.repository';
import { UserRoleRepository } from './repositories/userRole.repository';

/**
 * 角色 Module
 */
@Module({
  controllers: [RoleController],
  providers: [RoleService, RoleRepository, RoleMenuRepository, UserRoleRepository],
  exports: [RoleService, RoleRepository, RoleMenuRepository, UserRoleRepository],
})
export class RoleModule {}
