import CryptoJS from "crypto-js";
import { JSEncrypt } from "jsencrypt";
import storage from "./storage";

// 默认AES密钥（应替换为实际业务密钥）
const AES_KEY = "abcdefgabcdefg12"; // 16字节长度
// RSA密钥类型
type RsaKeyType = "public" | "private";

/**
 * 获取系统存储的密钥
 * @param type 密钥类型(public/private)
 * @returns 对应的密钥字符串
 */
const getSystemKey = (type: RsaKeyType): string => {
  const CONFIG = storage.get("CONFIG");
  if (!CONFIG?.publicKey && type === "public") {
    throw new Error("系统公钥未配置");
  }
  return type === "public" ? CONFIG.publicKey : "";
};

/**
 * 加解密工具模块
 * 提供对称加密(AES)和非对称加密(RSA)的功能
 */
const cryptoUtils = {
  /**
   * AES对称加密
   * @param plaintext 明文
   * @param key 加密密钥
   * @returns 返回密文
   */
  aesEncrypt(plaintext: string, key: string = AES_KEY): string {
    const utf8Key = CryptoJS.enc.Utf8.parse(key);
    const utf8Text = CryptoJS.enc.Utf8.parse(plaintext);

    const encrypted = CryptoJS.AES.encrypt(utf8Text, utf8Key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  },

  /**
   * AES对称解密
   * @param ciphertext Base64格式的密文
   * @param key 解密密钥(可选)
   * @returns 解密后的明文
   */
  aesDecrypt(ciphertext: string, key: string = AES_KEY): string {
    const utf8Key = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.AES.decrypt(ciphertext, utf8Key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  },
  /**
   * RSA非对称加密
   * @param plaintext 待加密文本
   * @param publicKey 公钥(可选)
   * @returns Base64编码的密文
   */
  rsaEncrypt(plaintext: string, publicKey?: string): string {
    const key = publicKey || getSystemKey("public");
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(key);

    const encrypted = encryptor.encrypt(plaintext);

    return encrypted || "";
  },

  /**
   * RSA非对称解密
   * @param ciphertext Base64格式密文
   * @param privateKey 私钥
   * @returns 解密后的明文
   */
  rsaDecrypt(ciphertext: string, privateKey: string): string {
    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(privateKey);

    const decrypted = decryptor.decrypt(ciphertext);

    return decrypted || "";
  },
};

export default cryptoUtils;

// 使用示例
// // AES加密
// const aesEncrypted = cryptoUtils.aesEncrypt("敏感数据", "custom-key-12345");
// // AES解密
// const aesDecrypted = cryptoUtils.aesDecrypt(aesEncrypted, "custom-key-12345");

// // RSA加密（使用系统公钥）
// const rsaEncrypted = cryptoUtils.rsaEncrypt("密码数据");
// // RSA解密（需要私钥）
// const rsaDecrypted = cryptoUtils.rsaDecrypt(rsaEncrypted, "-----BEGIN PRIVATE KEY-----...");
