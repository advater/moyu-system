import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

import { RAW_RESPONSE_KEY, PUBLIC_PATHS } from '@/config/constants';
import { CommonError } from '@/config/error-messages';
import { I18nService } from '@/i18n';

type TResponse<T> =
  | { code: number; data: any; message: string }
  | { data: any }
  | string
  | number;

/**
 * 响应拦截器 — 统一包装 HTTP 成功响应为 { code, data, message } 结构
 */
@Injectable()
export class ResponseInterceptor<T = any>
  implements NestInterceptor<T, TResponse<T>>
{
  constructor(
    private reflector: Reflector,
    @Optional() private readonly i18n?: I18nService,
  ) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<any> {
    const isRawResponse = this.reflector.getAllAndOverride<boolean>(
      RAW_RESPONSE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (isRawResponse) {
      return next.handle();
    }

    const ctxType = ctx.getType();
    if (ctxType === 'http') {
      const request = ctx.switchToHttp().getRequest();
      const isInWhite = PUBLIC_PATHS.some((path) => {
        return path.endsWith('/')
          ? request.url.startsWith(path)
          : request.url === path || request.url.startsWith(path + '?');
      });
      if (isInWhite) {
        return next.handle();
      }
      const successMsg =
        this.i18n?.t(CommonError.SUCCESS) ??
        CommonError.SUCCESS;
      return next.handle().pipe(
        map((data) => ({
          code: 200,
          data: instanceToPlain(data),
          message: successMsg,
        })),
      );
    } else if (ctxType === 'rpc') {
      return next.handle();
    } else if (ctxType === 'ws') {
      return next.handle();
    }
    return next.handle();
  }
}
