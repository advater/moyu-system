/**
 * 加密工具集
 */
import type {
  RsaPublicKey,
  RsaPrivateKey,
  SignKeyObjectInput,
  SignPrivateKeyInput,
  CipherKey,
  BinaryLike,
} from 'node:crypto';
import * as crypto from 'node:crypto';

/** 支持的哈希算法类型 */
type THashtype = 'md5' | 'sha256' | 'sha512';

/**
 * 生成 hash
 * ⚠️ 注意：MD5 和 SHA-1 不适用于安全场景（密码存储、签名验证等），
 * 仅可用于非安全场景如缓存 key、数据指纹校验、ETag 生成等。
 * 安全场景请使用 sha256/sha512 或 bcrypt（密码）。
 */
export function generateHash(
  data: BinaryLike | string,
  hashtype: THashtype = 'sha256',
) {
  const hash = crypto.createHash(hashtype);
  const hashed = hash.update(data);
  return hashed.digest('hex');
}

/**
 * MD5 哈希 — 仅用于非安全场景（缓存 key、WebSocket token 校验等）
 * ⚠️ 不适用于密码存储或签名验证
 */
export function md5Hash(data: string) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/** SHA-256 哈希 — 适用于安全场景（数据完整性校验、HMAC 等） */
export function sha256Hash(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** 对称加密工具 — AES-256-CBC 模式 */
export const Symmetry = {
  /** 生成 256 位随机密钥 */
  generateKey(): Buffer {
    return crypto.randomBytes(32); // AES-256 需要 32 字节密钥
  },
  /** 生成 128 位初始化向量（IV） */
  generateIv(): Buffer {
    return crypto.randomBytes(16); // AES 块大小 16 字节
  },
  /** AES-256-CBC 加密，返回 { iv, encryptedData } 均为 hex 编码 */
  encrypt(text: string, key: CipherKey, iv: Buffer) {
    // 创建加密实例
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    // 加密输入数据
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    // 拼接最后的密文
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
  },
  /** AES-256-CBC 解密，iv 为 hex 编码字符串 */
  decrypt(secret: string, key: CipherKey, iv: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(iv, 'hex'),
    );
    let decrypted = decipher.update(secret, 'hex', 'utf-8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};

/** 非对称加密工具 — RSA 2048 位密钥对 */
export const Asymmetric = {
  /** 生成 RSA-2048 密钥对 */
  getKey() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    return { publicKey, privateKey };
  },
  /** 使用公钥加密，输出 hex 编码密文 */
  encrypted(text: string, publicKey: RsaPublicKey) {
    const encryptedBuffer = crypto.publicEncrypt(
      publicKey,
      Buffer.from(text, 'utf-8'),
    );
    return encryptedBuffer.toString('hex');
  },
  /** 使用私钥解密，输入 hex 编码密文 */
  decrypted(secretHex: string, privateKey: RsaPrivateKey) {
    const secretBuffer = Buffer.from(secretHex, 'hex');
    const result = crypto.privateDecrypt(privateKey, secretBuffer);
    return result.toString();
  },
};

/** 数字签名工具 — SHA256 + RSA 签名/验证 */
export const Sign = {
  /** 生成 RSA-2048 签名密钥对 */
  getKey() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    return { publicKey, privateKey };
  },
  /** 使用私钥生成 SHA256 签名，输出 Base64 */
  sign(data: string, privateKey: SignPrivateKeyInput): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  },
  /** 使用公钥验证 SHA256 签名 */
  verify(
    data: BinaryLike,
    signed: string,
    publicKey: SignKeyObjectInput,
  ): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signed, 'base64');
  },
};
