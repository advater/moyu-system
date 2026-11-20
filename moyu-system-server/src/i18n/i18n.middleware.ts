import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { I18nContext } from './i18n.context';

/**
 * 解析 Accept-Language / X-Lang，写入 ALS，供过滤器与业务翻译。
 */
@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

  use(req: any, _res: any, next: () => void) {
    const headers = req?.headers ?? {};
    const locale = this.i18n.resolveFromHeaders(headers);
    req.locale = locale;
    I18nContext.run(locale, () => next());
  }
}
