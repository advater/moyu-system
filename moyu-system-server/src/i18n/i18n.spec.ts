import { messages as zhCN } from './locales/zh-CN';
import { messages as enUS } from './locales/en-US';
import { I18nContext } from './i18n.context';
import {
  i18nKey,
  interpolate,
  parseI18nMessage,
  resolveLocale,
  resolveOpsCopy,
} from './i18n.util';
import { AuthError, CommonError, OpLogSub, OpLogType, UserError } from '@/config/error-messages';

const CATALOGS = {
  'zh-CN': zhCN as Record<string, string>,
  'en-US': enUS as Record<string, string>,
};

function translate(
  raw: string,
  locale: 'zh-CN' | 'en-US',
): string {
  return resolveOpsCopy(raw, locale, CATALOGS);
}

describe('i18n', () => {
  it('resolveLocale prefers en / zh', () => {
    expect(resolveLocale('en-US,en;q=0.9')).toBe('en-US');
    expect(resolveLocale('zh-CN')).toBe('zh-CN');
    expect(resolveLocale(undefined)).toBe('zh-CN');
  });

  it('zh/en catalogs cover error message keys', () => {
    expect(zhCN[UserError.NOT_FOUND]).toBe('该用户不存在');
    expect(enUS[UserError.NOT_FOUND]).toBe('User not found');
    expect(zhCN[CommonError.SUCCESS]).toBe('成功');
    expect(enUS[CommonError.SUCCESS]).toBe('Success');
  });

  it('interpolates args via i18nKey encoding', () => {
    const raw = i18nKey(AuthError.PASSWORD_WRONG, { remaining: 2 });
    expect(parseI18nMessage(raw)).toEqual({
      key: 'AUTH.PASSWORD_WRONG',
      args: { remaining: '2' },
    });
    expect(translate(raw, 'en-US')).toBe(
      'Incorrect password, 2 attempts left',
    );
    expect(translate(raw, 'zh-CN')).toBe('密码错误，还剩2次尝试机会');
  });

  it('ALS holds request locale', () => {
    I18nContext.run('en-US', () => {
      expect(I18nContext.getLocale()).toBe('en-US');
      expect(translate(CommonError.SUCCESS, I18nContext.getLocale())).toBe(
        'Success',
      );
    });
  });

  it('passes through free-text ops copy', () => {
    expect(translate('自定义运营文案', 'en-US')).toBe('自定义运营文案');
  });

  it('resolves bilingual JSON ops copy', () => {
    const raw = '{"zh-CN":"用户不存在","en-US":"User not found"}';
    expect(translate(raw, 'en-US')).toBe('User not found');
    expect(translate(raw, 'zh-CN')).toBe('用户不存在');
  });

  it('resolves OP_LOG keys', () => {
    expect(translate(OpLogType.USER, 'zh-CN')).toBe('用户管理');
    expect(translate(OpLogSub.USER_CREATE, 'en-US')).toBe(
      'Create User',
    );
  });

  it('interpolate still works standalone', () => {
    expect(interpolate('hi {name}', { name: 'a' })).toBe('hi a');
  });
});
