import { Global, Module } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { I18nMiddleware } from './i18n.middleware';

@Global()
@Module({
  providers: [I18nService, I18nMiddleware],
  exports: [I18nService, I18nMiddleware],
})
export class I18nModule {}
