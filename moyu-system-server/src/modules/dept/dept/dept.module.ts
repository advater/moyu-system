import { Module } from '@nestjs/common';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { DeptRepository } from './repositories/dept.repository';

/**
 * 部门 Module
 */
@Module({
  controllers: [DeptController],
  providers: [DeptService, DeptRepository],
  exports: [DeptService, DeptRepository],
})
export class DeptModule {}
