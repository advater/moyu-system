import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import type { Readable } from 'node:stream';

export function md5Buffer(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

export function md5String(value: string): string {
  return createHash('md5').update(value, 'utf8').digest('hex');
}

export function md5File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function md5Readable(stream: Readable): Promise<string> {
  const hash = createHash('md5');
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  return hash.digest('hex');
}

/** 与前端 SparkMD5 拼接各分片 hash 后再 MD5 对齐 */
export function md5JoinedChunkHashes(chunkHashes: string[]): string {
  return md5String(chunkHashes.join(''));
}
