import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

/**
 * 按优先级加载环境文件（已存在的变量不会被后续文件覆盖）：
 * .env.{NODE_ENV}.local → .env.{NODE_ENV} → .env.local → .env
 * NODE_ENV 未设置时默认 development。
 * 已入库的 .env.{NODE_ENV} 只放非密钥默认值；占位密钥会盖住本地 .env，导致 prisma:deploy 等连库失败。
 */
export function loadEnvFiles(cwd = process.cwd()) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  const nodeEnv = process.env.NODE_ENV;
  for (const file of [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env',
  ]) {
    loadDotenv({ path: resolve(cwd, file) });
  }
}

loadEnvFiles();
