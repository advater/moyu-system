import { Module } from '@nestjs/common';
import { DictTypeController } from './dictType.controller';
import { DictTypeService } from './dictType.service';
import { DictTypeRepository } from './repositories/dictType.repository';

/**
 * 字典类型 Module
 */
@Module({
  controllers: [DictTypeController],
  providers: [DictTypeService, DictTypeRepository],
  exports: [DictTypeService],
})
export class DictTypeModule {}