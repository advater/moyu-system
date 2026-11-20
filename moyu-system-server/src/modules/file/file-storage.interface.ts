import type { Readable } from 'node:stream';

export type FileStorageKind = 'local' | 'oss';

export interface ByteRange {
  start: number;
  end: number;
}

export interface FileHead {
  size: number;
  contentType?: string;
}

export interface UploadSessionMeta {
  uploadId: string;
  destPath: string;
  mime: string;
  totalChunks: number;
  ossUploadId?: string;
}

export interface CreateUploadSessionResult {
  ossUploadId?: string;
  partUrls?: string[];
}

/**
 * 文件存储抽象（本地 / OSS 可插拔）
 */
export interface FileStorage {
  buildRelativePath(hash: string, ext: string, tenantId: string): string;
  save(relativePath: string, buffer: Buffer, mime?: string): Promise<void>;
  saveStream(
    relativePath: string,
    stream: NodeJS.ReadableStream,
    mime?: string,
  ): Promise<void>;
  read(relativePath: string): Promise<Buffer>;
  createReadStream(
    relativePath: string,
    range?: ByteRange,
  ): Promise<Readable>;
  head(relativePath: string): Promise<FileHead>;
  remove(relativePath: string): Promise<void>;
  /** 对外访问 URL；local 走 preview，OSS 走公网直链 */
  buildUrl(fileId: number, relativePath: string): string;
  getDownloadUrl?(
    fileId: number,
    relativePath: string,
    disposition: 'inline' | 'attachment',
    fileName?: string,
  ): Promise<string | null>;
  saveChunk(
    uploadId: string,
    index: number,
    buffer: Buffer,
    session?: UploadSessionMeta,
  ): Promise<{ etag?: string }>;
  mergeChunks(
    uploadId: string,
    destPath: string,
    total: number,
    mime?: string,
  ): Promise<void>;
  createUploadSession?(
    meta: UploadSessionMeta,
  ): Promise<CreateUploadSessionResult>;
  completeUploadSession?(
    session: UploadSessionMeta,
    parts?: { etag: string; partNumber: number }[],
  ): Promise<void>;
  abortUploadSession?(session: UploadSessionMeta): Promise<void>;
  removeChunks?(uploadId: string): Promise<void>;
  readonly kind: FileStorageKind;
}
