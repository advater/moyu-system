import { configYaml } from './yaml';
import { ConfigError } from '@/config/error-messages';

/** 扩展名 → MIME 类型映射（用于分片合并后还原 MIME） */
export const EXT_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.7z': 'application/x-7z-compressed',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

/** 允许上传的图片 MIME 类型（不含 SVG，避免内联 XSS） */
export const DEFAULT_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

/** 允许上传的文档 MIME 类型 */
export const DEFAULT_ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

/** 允许上传的文件扩展名 */
export const DEFAULT_ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'zip', 'rar', '7z',
  'mp4', 'mp3', 'txt', 'csv',
];

/** 文件头魔数签名 key: MIME 类型, value: 偏移量和匹配字节的数组 */
export const MAGIC_SIGNATURES: Record<string, Array<{ offset: number; bytes: number[] }>> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  'image/gif': [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  'image/webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
  'image/bmp': [{ offset: 0, bytes: [0x42, 0x4d] }],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
  'application/zip': [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }],
  'application/x-7z-compressed': [{ offset: 0, bytes: [0x37, 0x7a, 0xbc, 0xaf] }],
};

/** MIME 类型 → 子目录映射 */
export const MIME_DIR_MAP: Record<string, string> = {
  text: 'texts',
  image: 'images',
  audio: 'audios',
  video: 'videos',
  application: 'files',
};

export interface FileConfig {
  baseUrl: string;
  uploadDir: string;
  chunkDir: string;
  bigFileDir: string;
  tempDir: string;
  maxFileSize: number;
  maxChunkSize: number;
  maxChunkFileSize: number;
  maxLargeFileSize: number;
  chunkConcurrency: number;
  base64MaxSize: number;
  chunkUploadTTL: number;
  softDeleteTTL: number;
  previewTicketTTL: number;
  allowedImageTypes: string[];
  allowedDocTypes: string[];
  allowedExtensions: string[];
  /** local | oss */
  storage: string;
}

/** 获取文件上传配置 — 从 config.yaml 读取，未配置时使用默认值 */
export const getFileConfig = (): FileConfig => {
  const yamlConfig = configYaml();
  return {
    baseUrl: yamlConfig.file?.baseUrl || 'http://localhost:3000/',
    uploadDir: yamlConfig.file?.uploadDir || 'uploads',
    chunkDir: yamlConfig.file?.chunkDir || 'uploads/chunks',
    bigFileDir: yamlConfig.file?.bigFileDir || 'bigFiles',
    tempDir: yamlConfig.file?.tempDir || 'temp',
    maxFileSize: parseInt(yamlConfig.file?.maxFileSize || '52428800', 10),
    maxChunkSize: parseInt(yamlConfig.file?.maxChunkSize || '5242880', 10),
    maxChunkFileSize: parseInt(
      yamlConfig.file?.maxChunkFileSize ||
        yamlConfig.file?.maxChunkSize ||
        '5242880',
      10,
    ),
    maxLargeFileSize: parseInt(
      yamlConfig.file?.maxLargeFileSize || '5368709120',
      10,
    ),
    chunkConcurrency: parseInt(yamlConfig.file?.chunkConcurrency || '3', 10),
    base64MaxSize: parseInt(yamlConfig.file?.base64MaxSize || '1048576', 10),
    chunkUploadTTL: parseInt(yamlConfig.file?.chunkUploadTTL || '86400000', 10),
    softDeleteTTL: parseInt(
      yamlConfig.file?.softDeleteTTL || '604800000',
      10,
    ),
    previewTicketTTL: parseInt(
      yamlConfig.file?.previewTicketTTL || '900000',
      10,
    ),
    allowedImageTypes: yamlConfig.file?.allowedImageTypes || DEFAULT_ALLOWED_IMAGE_TYPES,
    allowedDocTypes: yamlConfig.file?.allowedDocTypes || DEFAULT_ALLOWED_DOC_TYPES,
    allowedExtensions: yamlConfig.file?.allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS,
    storage: process.env.FILE_STORAGE || yamlConfig.file?.storage || 'local',
  };
};

/** 获取 JWT 配置 — 密钥从 .env 读取，有效期等从 config.yaml 读取 */
export const getJwtConfig = () => {
  const yamlConfig = configYaml();
  const jwtConfig = yamlConfig.jwt;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(ConfigError.JWT_SECRET_REQUIRED);
    }
  }
  return {
    secret: secret || 'dev_jwt_secret_change_me_in_production',
    accessTokenExpire: jwtConfig?.accessExpire || '15m',
    refreshTokenExpire: jwtConfig?.refreshExpire || '7d',
    issuer: jwtConfig?.issuer || 'nestjs-app',
  };
};

/** 获取应用基础配置 — 端口、环境、API前缀等 */
export const getAppConfig = () => {
  const yamlConfig = configYaml();
  return {
    port: yamlConfig.app?.port || 3000,
    env: process.env.NODE_ENV || yamlConfig.app?.env || 'development',
    apiPrefix: yamlConfig.app?.apiPrefix || '',
    corsEnabled: yamlConfig.app?.corsEnabled ?? true,
  };
};