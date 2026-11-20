/**
 * YAML 配置加载器
 *
 * 从 config.yaml 文件读取应用配置，首次调用后缓存结果，
 * 后续调用直接返回缓存值，避免重复读取文件。
 *
 * 配置覆盖顺序：.env 环境变量 > config.yaml > 代码默认值
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
import { YAML_CONFIG_FILENAME } from './constants';

/** 配置缓存，避免重复解析 YAML 文件 */
let cachedConfig: Record<string, any> | null = null;

/** 获取 YAML 配置对象（带缓存） */
export const configYaml = (): Record<string, any> => {
  if (cachedConfig) return cachedConfig;
  cachedConfig = yaml.load(
    readFileSync(join(process.cwd(), YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
  return cachedConfig;
};
