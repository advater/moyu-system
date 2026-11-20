import {
  assertSmsCallbackToken,
  SmsCallbackAuthError,
} from './sms-callback-auth';
import { assertSmsCallbackHmac } from './sms-callback-hmac';

describe('assertSmsCallbackToken', () => {
  it('生产环境未配置密钥 → 501', () => {
    expect(() =>
      assertSmsCallbackToken(undefined, {
        secret: '',
        nodeEnv: 'production',
      }),
    ).toThrow(SmsCallbackAuthError);
    try {
      assertSmsCallbackToken(undefined, { secret: '', nodeEnv: 'production' });
    } catch (e) {
      expect((e as SmsCallbackAuthError).statusCode).toBe(501);
    }
  });

  it('开发环境未配置密钥 → dev-skip', () => {
    expect(
      assertSmsCallbackToken(undefined, {
        secret: '',
        nodeEnv: 'development',
      }),
    ).toBe('dev-skip');
  });

  it('密钥不匹配 → 403', () => {
    try {
      assertSmsCallbackToken('wrong', {
        secret: 'secret-token',
        nodeEnv: 'development',
      });
      fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(SmsCallbackAuthError);
      expect((e as SmsCallbackAuthError).statusCode).toBe(403);
    }
  });

  it('密钥匹配 → ok', () => {
    expect(
      assertSmsCallbackToken('secret-token', {
        secret: 'secret-token',
        nodeEnv: 'production',
      }),
    ).toBe('ok');
  });
});

describe('assertSmsCallbackHmac', () => {
  it('未配置 HMAC secret → skip', () => {
    expect(
      assertSmsCallbackHmac('body', 'sig', { secret: '' }),
    ).toBe('skip');
  });

  it('HMAC 匹配 → ok', () => {
    const { createHmac } = require('node:crypto') as typeof import('node:crypto');
    const secret = 'hmac-secret';
    const body = '{"ok":true}';
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(assertSmsCallbackHmac(body, sig, { secret })).toBe('ok');
  });

  it('HMAC 不匹配 → 403', () => {
    expect(() =>
      assertSmsCallbackHmac('body', 'deadbeef', { secret: 'hmac-secret' }),
    ).toThrow(SmsCallbackAuthError);
  });
});
