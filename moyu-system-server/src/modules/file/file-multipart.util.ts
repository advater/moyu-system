import type { MultipartFile } from '@fastify/multipart';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FileError } from '@/config/error-messages';
import { parseAllowedTypes } from './file-validate';

export function multipartField(
  fields: MultipartFile['fields'] | undefined,
  name: string,
): string {
  if (!fields) return '';
  const raw = (fields as Record<string, unknown>)[name];
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return multipartField({ [name]: raw[0] } as MultipartFile['fields'], name);
  }
  if (typeof raw === 'object' && raw && 'value' in raw) {
    const value = (raw as { value: unknown }).value;
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      return '';
    }
    return String(value ?? '');
  }
  return '';
}

export function multipartAllowedTypes(
  fields: MultipartFile['fields'] | undefined,
): string[] | undefined {
  if (!fields) return undefined;
  const raw = (fields as Record<string, unknown>).allowedTypes;
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    return parseAllowedTypes(
      raw.map((item) =>
        item && typeof item === 'object' && 'value' in item
          ? (item as { value: unknown }).value
          : item,
      ),
    );
  }
  if (typeof raw === 'object' && raw && 'value' in raw) {
    return parseAllowedTypes((raw as { value: unknown }).value);
  }
  return parseAllowedTypes(raw);
}

export async function readMultipartBuffer(
  file: MultipartFile,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of file.file) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) {
      file.file.destroy();
      throw new HttpException(FileError.TOO_LARGE, HttpStatus.BAD_REQUEST);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks, size);
}
