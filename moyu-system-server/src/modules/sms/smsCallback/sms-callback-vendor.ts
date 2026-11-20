import { SmsError } from '@/config/error-messages';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SmsCallbackAuthError } from './sms-callback-auth';

/**
 * 腾讯云短信状态回调验签（可选）
 * 配置 SMS_TENCENT_APP_KEY 后：要求 Header `x-tc-signature` 或 Query `sign`
 * = Base64(HMAC-SHA256(AppKey, rawBody))
 * @see https://cloud.tencent.com/document/product/382/52077
 */
export function assertTencentSmsCallbackSign(
  rawBody: string | Buffer | undefined,
  signature: string | undefined,
  options?: { appKey?: string },
): 'ok' | 'skip' {
  const appKey = (
    options?.appKey ?? process.env.SMS_TENCENT_APP_KEY
  )?.trim();
  if (!appKey) return 'skip';
  if (!signature?.trim()) {
    throw new SmsCallbackAuthError(SmsError.TENCENT_CALLBACK_SIGNATURE_MISSING, 403);
  }
  const body = rawBody == null ? '' : rawBody;
  const expected = createHmac('sha256', appKey)
    .update(body)
    .digest('base64');
  const provided = signature.trim();
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new SmsCallbackAuthError(SmsError.TENCENT_CALLBACK_VERIFY_FAILED, 403);
  }
  return 'ok';
}

/**
 * 阿里云短信回调简易验签（可选）
 * 配置 SMS_ALIYUN_ACCESS_KEY_SECRET 后：要求 Header `x-acs-signature`
 * = Base64(HMAC-SHA1(AccessKeySecret, rawBody))
 * （对接官方复杂规范前的过渡方案；正式环境建议再对齐官方算法）
 */
export function assertAliyunSmsCallbackSign(
  rawBody: string | Buffer | undefined,
  signature: string | undefined,
  options?: { accessKeySecret?: string },
): 'ok' | 'skip' {
  const secret = (
    options?.accessKeySecret ?? process.env.SMS_ALIYUN_ACCESS_KEY_SECRET
  )?.trim();
  if (!secret) return 'skip';
  if (!signature?.trim()) {
    throw new SmsCallbackAuthError(SmsError.ALIYUN_CALLBACK_SIGNATURE_MISSING, 403);
  }
  const body = rawBody == null ? '' : rawBody;
  const expected = createHmac('sha1', secret).update(body).digest('base64');
  const provided = signature.trim();
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new SmsCallbackAuthError(SmsError.ALIYUN_CALLBACK_VERIFY_FAILED, 403);
  }
  return 'ok';
}
