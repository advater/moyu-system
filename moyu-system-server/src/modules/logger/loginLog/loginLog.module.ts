import { Module } from '@nestjs/common';
import { LoginLogController } from './loginLog.controller';
import { LoginLogService } from './loginLog.service';
import { LoginLogRepository } from './repositories/loginLog.repository';

/**
 * 登录日志 Module
 */
@Module({
  controllers: [LoginLogController],
  providers: [LoginLogService, LoginLogRepository],
  exports: [LoginLogService],
})
export class LoginLogModule {}
