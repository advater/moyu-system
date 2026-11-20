/**
 * 密码工具 — 管理员密码（bcrypt）与会员密码（PBKDF2）的哈希与验证
 */
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

/** bcrypt 加盐轮数 — 10 轮是安全与性能的平衡点 */
const SALT_ROUNDS = 10;

/** 加盐哈希密码（bcrypt 自动处理 salt，保留 salt 参数兼容现有调用） */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** 密码比较 */
export async function comparePwd(password: string, hashed: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashed);
  } catch {
    return false;
  }
}

/** 生成盐值（bcrypt 自动处理 salt，保留接口兼容现有 entity schema） */
export function generateSalt(length = 10): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/** 会员密码 — 使用 PBKDF2 + 内嵌盐值格式 (salt:hash) */
export function hashMemberPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/** 验证会员密码 — 从存储格式 salt:hash 中拆分后重新计算比对 */
export function verifyMemberPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return computed === hash;
}