import { Global, Module } from '@nestjs/common';
import { ErrorCodeController } from './errorCode.controller';
import { ErrorCodeService } from './errorCode.service';
import { ErrorCodeRepository } from './repositories/errorCode.repository';

@Global()
@Module({
  controllers: [ErrorCodeController],
  providers: [ErrorCodeService, ErrorCodeRepository],
  exports: [ErrorCodeService],
})
export class ErrorCodeModule {}
