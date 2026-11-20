import { Module } from '@nestjs/common';
import { IpController } from './ip.controller';
import { IpService } from './ip.service';

/**
 * IP 区域 Module
 */
@Module({
  controllers: [IpController],
  providers: [IpService],
  exports: [IpService],
})
export class IpModule {}
