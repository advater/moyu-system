/**
 * 密码/密钥强度校验（导入默认密码、OAuth client secret 等）
 */
import { HttpException, HttpStatus } from '@nestjs/common';

import { UserError } from '@/config/error-messages';

/** 用户密码最小长度（创建用户 / 改密 / 重置密码统一口径） */
export const USER_PASSWORD_MIN_LENGTH = 8;

/**
 * 用户密码策略校验：不满足时抛 400 业务错误
 *
 * 供「创建用户 / 管理员重置密码 / 用户自助改密」统一复用，
 * 规则见 assertPasswordStrength（长度 + 字母数字 + 弱口令黑名单）。
 */
export function assertUserPassword(password: string | undefined): void {
  try {
    assertPasswordStrength(password, '密码', USER_PASSWORD_MIN_LENGTH);
  } catch {
    throw new HttpException(
      UserError.PASSWORD_STRENGTH,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertPasswordStrength(
  value: string | undefined,
  label = '密码',
  minLen = 12,
): void {
  const v = (value ?? '').trim();
  if (!v) {
    throw new Error(`${label}不能为空`);
  }
  if (v.length < minLen) {
    throw new Error(`${label}长度须 ≥ ${minLen}`);
  }
  const hasLetter = /[A-Za-z]/.test(v);
  const hasDigit = /\d/.test(v);
  if (!hasLetter || !hasDigit) {
    throw new Error(`${label}须同时包含字母与数字`);
  }
  const weak = [
    '123456',
    'password',
    'admin123',
    'changeme',
    'qwerty',
  ];
  if (weak.some((w) => v.toLowerCase().includes(w))) {
    throw new Error(`${label}过于简单，请更换`);
  }
}

export function assertSecretStrength(
  value: string | undefined,
  label = '密钥',
  minLen = 32,
): void {
  const v = (value ?? '').trim();
  if (!v) {
    throw new Error(`${label}不能为空`);
  }
  if (v.length < minLen) {
    throw new Error(`${label}长度须 ≥ ${minLen}`);
  }
}
