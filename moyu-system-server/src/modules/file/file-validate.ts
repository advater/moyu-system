import { extname } from 'node:path';
import { open } from 'node:fs/promises';
import {
  DEFAULT_ALLOWED_DOC_TYPES,
  DEFAULT_ALLOWED_IMAGE_TYPES,
  EXT_MIME_MAP,
  MAGIC_SIGNATURES,
  getFileConfig,
} from '@/config/file.config';

const MAX_MAGIC_BYTES = 16;

/** 配置中允许的图片 + 文档 MIME（分片合并前可用于类型白名单） */
export function allowedUploadMimeTypes(): string[] {
  const cfg = getFileConfig();
  const images =
    cfg.allowedImageTypes?.length > 0
      ? cfg.allowedImageTypes
      : DEFAULT_ALLOWED_IMAGE_TYPES;
  const docs =
    cfg.allowedDocTypes?.length > 0
      ? cfg.allowedDocTypes
      : DEFAULT_ALLOWED_DOC_TYPES;
  return [...images, ...docs];
}

/** 仅规范化扩展名供存盘路径使用，不做类型白名单 */
export function fileExtension(filename: string): string {
  const ext = extname(filename || '').toLowerCase().replace(/^\./, '');
  if (!ext || !/^[a-z0-9]+$/i.test(ext) || ext.length > 16) return 'bin';
  return ext;
}

const TYPE_TOKEN =
  /^(?:[a-z0-9!#$&^_.+-]+\/(?:[a-z0-9!#$&^_.+-]+|\*)|\.?[a-z0-9]{1,16})$/i;

function normalizeTypeToken(item: unknown): string | undefined {
  if (typeof item !== 'string') return undefined;
  const rule = item.trim().toLowerCase();
  return TYPE_TOKEN.test(rule) ? rule : undefined;
}

/** 未传、空串、空数组或无法识别的值 → 不限制 */
export function parseAllowedTypes(
  raw?: unknown,
): string[] | undefined {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) {
    const list = raw.map(normalizeTypeToken).filter((s): s is string => !!s);
    return list.length ? list : undefined;
  }
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('[')) {
    try {
      return parseAllowedTypes(JSON.parse(trimmed) as unknown);
    } catch {
      return undefined;
    }
  }
  const list = trimmed
    .split(/[,;]/)
    .map(normalizeTypeToken)
    .filter((s): s is string => !!s);
  return list.length ? list : undefined;
}

/** 仅当 allowedTypes 为非空数组时限制；支持 video/*、video/mp4、.mp4、mp4 */
export function matchesAllowedTypes(
  filename: string,
  mime: string | undefined,
  allowedTypes?: string[],
): boolean {
  if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) return true;
  const ext = fileExtension(filename);
  const mimeNorm = (mime || mimeFromExt(ext)).toLowerCase();
  return allowedTypes.some((item) => {
    const rule = normalizeTypeToken(item);
    if (!rule) return false;
    if (rule.endsWith('/*')) {
      return mimeNorm.startsWith(rule.slice(0, -1));
    }
    if (rule.includes('/')) {
      return mimeNorm === rule || ext === rule.split('/')[1];
    }
    return ext === rule.replace(/^\./, '');
  });
}

/** 根据扩展名推断 MIME */
export function mimeFromExt(ext: string): string {
  const key = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return EXT_MIME_MAP[key] || 'application/octet-stream';
}

/** 魔数与声明 MIME 是否匹配（无签名规则时放行） */
export function matchesMagic(buffer: Buffer, mime: string): boolean {
  const rules = MAGIC_SIGNATURES[mime];
  if (!rules || rules.length === 0) return true;
  return rules.some((rule) => {
    if (buffer.length < rule.offset + rule.bytes.length) return false;
    return rule.bytes.every(
      (b, i) => buffer[rule.offset + i] === b,
    );
  });
}

/** 只读文件头做魔数校验，避免把整个文件读进内存 */
export async function matchesMagicFromPath(
  filePath: string,
  mime: string,
): Promise<boolean> {
  const rules = MAGIC_SIGNATURES[mime];
  if (!rules || rules.length === 0) return true;
  try {
    const handle = await open(filePath, 'r');
    const buffer = Buffer.alloc(MAX_MAGIC_BYTES);
    await handle.read(buffer, 0, MAX_MAGIC_BYTES, 0);
    await handle.close();
    return matchesMagic(buffer, mime);
  } catch {
    return false;
  }
}

export function parseDataUrlBase64(dataUrl: string): {
  buffer: Buffer;
  mime?: string;
  byteLength: number;
} {
  if (!dataUrl || !dataUrl.startsWith('data:') || !dataUrl.includes(',')) {
    throw new Error('INVALID_BASE64');
  }
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma);
  const base64 = dataUrl.slice(comma + 1);
  const padding = (base64.match(/=+$/) || [''])[0].length;
  const byteLength = Math.ceil((base64.length * 3) / 4 - padding);
  return {
    buffer: Buffer.from(base64, 'base64'),
    mime: meta.split(';')[0] || undefined,
    byteLength,
  };
}
