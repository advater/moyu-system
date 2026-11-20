import { configYaml } from '@/config/yaml';
import type { FileStorage } from './file-storage.interface';
import { LocalFileStorage } from './local-file.storage';
import { OssFileStorage } from './oss-file.storage';

/**
 * FILE_STORAGE / config.yaml.file.storage：
 * - oss：对象存储
 * - 其它或未配置：本地 uploads/*
 */
export function createFileStorage(): FileStorage {
  const yamlType = configYaml().file?.storage as string | undefined;
  const type = (
    process.env.FILE_STORAGE ||
    yamlType ||
    'local'
  ).toLowerCase();
  if (type === 'oss') {
    return new OssFileStorage();
  }
  return new LocalFileStorage();
}
