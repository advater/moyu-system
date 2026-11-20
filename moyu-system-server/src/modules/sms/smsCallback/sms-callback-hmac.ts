import { SmsError } from '@/config/error-messages';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SmsCallbackAuthError } from './sms-callback-auth';

/**
 * 可选厂商级 HMAC 验签：hex(HMAC-SHA256(rawBody, secret))
 * 配置 SMS_CALLBACK_HMAC_SECRET 后强制校验请求头 x-sms-signature。
 */
export function assertSmsCallbackHmac(
  rawBody: string | Buffer | undefined,
  signature: string | undefined,
  options?: {
    secret?: string;
  },
): 'ok' | 'skip' {
  const secret = (
    options?.secret ?? process.env.SMS_CALLBACK_HMAC_SECRET
  )?.trim();
  if (!secret) {
    return 'skip';
  }
  if (!signature?.trim()) {
    throw new SmsCallbackAuthError(SmsError.CALLBACK_SIGNATURE_MISSING, 403);
  }
  const body = rawBody == null ? '' : rawBody;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const provided = signature.trim().toLowerCase().replace(/^sha256=/i, '');
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new SmsCallbackAuthError(SmsError.CALLBACK_HMAC_FAILED, 403);
  }
  return 'ok';
}
