import { SmsError } from '@/config/error-messages';
import { timingSafeEqual } from 'node:crypto';

/**
 * 短信回调验签错误（不依赖 Nest，便于 Jest 直接测）
 */
export class SmsCallbackAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'SmsCallbackAuthError';
  }
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * 校验短信厂商回调凭证（纯函数）
 *
 * 仅接受 Header 携带的共享密钥（禁止 Query）。
 * 可选：配置 SMS_CALLBACK_HMAC_SECRET 时，另需 x-sms-signature =
 * hex(HMAC-SHA256(rawBody, secret))（由上层在解析 body 前传入已算好的校验结果或自行验签）。
 *
 * @returns 'ok' | 'dev-skip'
 */
export function assertSmsCallbackToken(
  token: string | undefined,
  options?: {
    secret?: string;
    nodeEnv?: string;
  },
): 'ok' | 'dev-skip' {
  const secret = (options?.secret ?? process.env.SMS_CALLBACK_SECRET)?.trim();
  const isProd =
    (options?.nodeEnv ?? process.env.NODE_ENV) === 'production';
  if (!secret) {
    if (isProd) {
      throw new SmsCallbackAuthError(
        SmsError.CALLBACK_SECRET_MISSING,
        501,
      );
    }
    return 'dev-skip';
  }
  if (!token || !safeEqualString(token, secret)) {
    throw new SmsCallbackAuthError(SmsError.CALLBACK_VERIFY_FAILED, 403);
  }
  return 'ok';
}
