import { Module } from '@nestjs/common';
import { MailAccountController } from './mailAccount.controller';
import { MailAccountService } from './mailAccount.service';
import { MailAccountRepository } from './repositories/mailAccount.repository';

/**
 * 邮件账号 Module
 */
@Module({
  controllers: [MailAccountController],
  providers: [MailAccountService, MailAccountRepository],
  exports: [MailAccountService],
})
export class MailAccountModule {}
