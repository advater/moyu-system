import { Module } from '@nestjs/common';
import { DictDataController } from './dictData.controller';
import { DictDataService } from './dictData.service';
import { DictDataRepository } from './repositories/dictData.repository';

/**
 * 字典数据 Module
 */
@Module({
  controllers: [DictDataController],
  providers: [DictDataService, DictDataRepository],
  exports: [DictDataService],
})
export class DictDataModule {}