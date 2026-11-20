import { existsSync, createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile, readFile, rm, stat, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { getFileConfig } from '@/config/file.config';
import { contentAddressPath } from './file-path.util';
import { safeUnlink } from './file-fs.util';
import { previewFileUrl } from './file-url.util';
import type {
  ByteRange,
  FileHead,
  FileStorage,
  UploadSessionMeta,
} from './file-storage.interface';

/**
 * 本地磁盘文件存储
 */
export class LocalFileStorage implements FileStorage {
  readonly kind = 'local' as const;

  private root(): string {
    const cfg = getFileConfig();
    return join(process.cwd(), cfg.uploadDir);
  }

  private chunkRoot(): string {
    const cfg = getFileConfig();
    return join(process.cwd(), cfg.chunkDir);
  }

  buildRelativePath(hash: string, ext: string, tenantId: string): string {
    return contentAddressPath(hash, ext, tenantId);
  }

  absolutePath(relativePath: string): string {
    return join(this.root(), relativePath.replace(/^[/\\]+/, ''));
  }

  private chunkPath(uploadId: string, index?: number): string {
    const dir = join(this.chunkRoot(), uploadId.replace(/[^a-zA-Z0-9_-]/g, ''));
    if (index == null) return dir;
    return join(dir, String(index));
  }

  async save(relativePath: string, buffer: Buffer): Promise<void> {
    await this.saveStream(relativePath, Readable.from(buffer));
  }

  async saveStream(
    relativePath: string,
    stream: NodeJS.ReadableStream,
  ): Promise<void> {
    const abs = this.absolutePath(relativePath);
    await mkdir(dirname(abs), { recursive: true });
    await pipeline(stream, createWriteStream(abs));
  }

  async read(relativePath: string): Promise<Buffer> {
    return readFile(this.absolutePath(relativePath));
  }

  createReadStream(
    relativePath: string,
    range?: ByteRange,
  ): Promise<Readable> {
    const abs = this.absolutePath(relativePath);
    if (range) {
      return Promise.resolve(
        createReadStream(abs, { start: range.start, end: range.end }),
      );
    }
    return Promise.resolve(createReadStream(abs));
  }

  async head(relativePath: string): Promise<FileHead> {
    const info = await stat(this.absolutePath(relativePath));
    return { size: info.size };
  }

  async remove(relativePath: string): Promise<void> {
    await safeUnlink(this.absolutePath(relativePath));
  }

  buildUrl(fileId: number, _relativePath?: string): string {
    return previewFileUrl(fileId);
  }

  getDownloadUrl(): Promise<string | null> {
    return Promise.resolve(null);
  }

  async saveChunk(
    uploadId: string,
    index: number,
    buffer: Buffer,
  ): Promise<{ etag?: string }> {
    const abs = this.chunkPath(uploadId, index);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, buffer);
    return {};
  }

  async mergeChunks(
    uploadId: string,
    destPath: string,
    total: number,
  ): Promise<void> {
    const destAbs = this.absolutePath(destPath);
    await mkdir(dirname(destAbs), { recursive: true });
    const writeStream = createWriteStream(destAbs);
    try {
      for (let i = 0; i < total; i++) {
        const chunkAbs = this.chunkPath(uploadId, i);
        if (!existsSync(chunkAbs)) {
          throw new Error(`missing chunk ${i}`);
        }
        await new Promise<void>((resolve, reject) => {
          const readStream = createReadStream(chunkAbs);
          readStream.pipe(writeStream, { end: false });
          readStream.on('end', () => resolve());
          readStream.on('error', reject);
        });
      }
    } catch (err) {
      writeStream.destroy();
      await safeUnlink(destAbs);
      throw err;
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.end(() => resolve());
    });
  }

  async removeChunks(uploadId: string): Promise<void> {
    const dir = this.chunkPath(uploadId);
    await rm(dir, { recursive: true, force: true });
  }

  async abortUploadSession(session: UploadSessionMeta): Promise<void> {
    await this.removeChunks(session.uploadId);
  }

  async listChunkIndexes(uploadId: string): Promise<number[]> {
    const dir = this.chunkPath(uploadId);
    try {
      const names = await readdir(dir);
      return names
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n))
        .sort((a, b) => a - b);
    } catch {
      return [];
    }
  }
}
