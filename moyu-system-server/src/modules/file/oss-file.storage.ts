import { createHmac, createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import axios, { type AxiosResponse } from 'axios';
import { getFileConfig } from '@/config/file.config';
import { contentAddressPath } from './file-path.util';
import { previewFileUrl } from './file-url.util';
import { configYaml } from '@/config/yaml';
import { FileError } from '@/config/error-messages';
import type {
  ByteRange,
  CreateUploadSessionResult,
  FileHead,
  FileStorage,
  UploadSessionMeta,
} from './file-storage.interface';

export interface OssStorageOptions {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  publicBaseUrl: string;
  prefix?: string;
}

const SIGNED_SUBRESOURCES = new Set([
  'acl',
  'uploads',
  'uploadId',
  'partNumber',
  'response-content-disposition',
  'response-content-type',
]);

/**
 * 阿里云 OSS（兼容签名 V1）存储适配器
 */
export class OssFileStorage implements FileStorage {
  readonly kind = 'oss' as const;
  private readonly opts: OssStorageOptions;

  constructor(opts?: Partial<OssStorageOptions>) {
    const yaml = configYaml().file?.oss || {};
    this.opts = {
      endpoint: (
        opts?.endpoint ||
        process.env.OSS_ENDPOINT ||
        yaml.endpoint ||
        ''
      ).replace(/^https?:\/\//, ''),
      bucket:
        opts?.bucket || process.env.OSS_BUCKET || yaml.bucket || '',
      accessKeyId:
        opts?.accessKeyId ||
        process.env.OSS_ACCESS_KEY_ID ||
        yaml.accessKeyId ||
        '',
      accessKeySecret:
        opts?.accessKeySecret ||
        process.env.OSS_ACCESS_KEY_SECRET ||
        yaml.accessKeySecret ||
        '',
      publicBaseUrl: (
        opts?.publicBaseUrl ||
        process.env.OSS_PUBLIC_BASE_URL ||
        yaml.publicBaseUrl ||
        ''
      ).replace(/\/?$/, ''),
      prefix:
        opts?.prefix ||
        process.env.OSS_PREFIX ||
        yaml.prefix ||
        'uploads/',
    };
    if (
      !this.opts.endpoint ||
      !this.opts.bucket ||
      !this.opts.accessKeyId ||
      !this.opts.accessKeySecret
    ) {
      throw new Error(FileError.OSS_CONFIG_INCOMPLETE);
    }
  }

  buildRelativePath(hash: string, ext: string, tenantId: string): string {
    const prefix = (this.opts.prefix || '').replace(/^\/+|\/+$/g, '');
    const key = contentAddressPath(hash, ext, tenantId);
    return prefix ? `${prefix}/${key}` : key;
  }

  async save(
    relativePath: string,
    buffer: Buffer,
    mime = 'application/octet-stream',
  ): Promise<void> {
    await this.ossRequest({
      method: 'PUT',
      objectKey: relativePath,
      mime,
      extraHeaders: { 'x-oss-object-acl': 'private' },
      data: buffer,
    });
  }

  async saveStream(
    relativePath: string,
    stream: NodeJS.ReadableStream,
    mime = 'application/octet-stream',
  ): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    await this.save(relativePath, Buffer.concat(chunks), mime);
  }

  async read(relativePath: string): Promise<Buffer> {
    const resp = await this.ossRequest({
      method: 'GET',
      objectKey: relativePath,
      responseType: 'arraybuffer',
    });
    return Buffer.from(resp.data);
  }

  async createReadStream(
    relativePath: string,
    range?: ByteRange,
  ): Promise<Readable> {
    const extraHeaders: Record<string, string> = {};
    if (range) {
      extraHeaders.Range = `bytes=${range.start}-${range.end}`;
    }
    const resp = await this.ossRequest({
      method: 'GET',
      objectKey: relativePath,
      extraHeaders,
      responseType: 'stream',
    });
    return resp.data as Readable;
  }

  async head(relativePath: string): Promise<FileHead> {
    const resp = await this.ossRequest({
      method: 'HEAD',
      objectKey: relativePath,
    });
    const len = Number(resp.headers['content-length'] || 0);
    return {
      size: Number.isFinite(len) ? len : 0,
      contentType: String(resp.headers['content-type'] || '') || undefined,
    };
  }

  async remove(relativePath: string): Promise<void> {
    await this.ossRequest({
      method: 'DELETE',
      objectKey: relativePath,
      accept404: true,
    });
  }

  buildUrl(fileId: number, _relativePath: string): string {
    return previewFileUrl(fileId);
  }

  getDownloadUrl(
    _fileId: number,
    relativePath: string,
    disposition: 'inline' | 'attachment',
    fileName?: string,
  ): Promise<string | null> {
    const expires = Math.floor(Date.now() / 1000) + 60;
    const extraQuery: Record<string, string> = {};
    if (fileName) {
      extraQuery['response-content-disposition'] =
        `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`;
    }
    return Promise.resolve(
      this.presign('GET', relativePath, expires, extraQuery),
    );
  }

  async createUploadSession(
    meta: UploadSessionMeta,
  ): Promise<CreateUploadSessionResult> {
    const resp = await this.ossRequest({
      method: 'POST',
      objectKey: meta.destPath,
      query: { uploads: '' },
      mime: meta.mime || 'application/octet-stream',
      extraHeaders: { 'x-oss-object-acl': 'private' },
      responseType: 'text',
    });
    const xml = String(resp.data || '');
    const match = /<UploadId>([^<]+)<\/UploadId>/i.exec(xml);
    if (!match) {
      throw new Error('OSS InitiateMultipartUpload failed');
    }
    const ossUploadId = match[1];
    const partUrls: string[] = [];
    const expires = Math.floor(Date.now() / 1000) + 6 * 3600;
    const maxParts = meta.totalChunks;
    for (let i = 0; i < maxParts; i++) {
      partUrls.push(
        this.presign('PUT', meta.destPath, expires, {
          partNumber: String(i + 1),
          uploadId: ossUploadId,
        }),
      );
    }
    return { ossUploadId, partUrls: partUrls.length ? partUrls : undefined };
  }

  async saveChunk(
    _uploadId: string,
    index: number,
    buffer: Buffer,
    session?: UploadSessionMeta,
  ): Promise<{ etag?: string }> {
    if (!session?.ossUploadId) {
      throw new Error('OSS upload session missing');
    }
    const resp = await this.ossRequest({
      method: 'PUT',
      objectKey: session.destPath,
      query: {
        partNumber: String(index + 1),
        uploadId: session.ossUploadId,
      },
      mime: 'application/octet-stream',
      data: buffer,
    });
    const etag = String(resp.headers.etag || resp.headers.ETag || '').replace(
      /"/g,
      '',
    );
    return { etag };
  }

  async mergeChunks(): Promise<void> {
    /* OSS 使用 CompleteMultipartUpload */
  }

  async completeUploadSession(
    session: UploadSessionMeta,
    parts?: { etag: string; partNumber: number }[],
  ): Promise<void> {
    if (!session.ossUploadId || !parts?.length) {
      throw new Error('OSS complete parts missing');
    }
    const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
    const body =
      '<CompleteMultipartUpload>' +
      sorted
        .map(
          (p) =>
            `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>"${p.etag.replace(/"/g, '')}"</ETag></Part>`,
        )
        .join('') +
      '</CompleteMultipartUpload>';
    await this.ossRequest({
      method: 'POST',
      objectKey: session.destPath,
      query: { uploadId: session.ossUploadId },
      mime: 'application/xml',
      data: body,
    });
  }

  async abortUploadSession(session: UploadSessionMeta): Promise<void> {
    if (!session.ossUploadId) return;
    await this.ossRequest({
      method: 'DELETE',
      objectKey: session.destPath,
      query: { uploadId: session.ossUploadId },
      accept404: true,
    });
  }

  presignPartUrl(
    destPath: string,
    ossUploadId: string,
    index: number,
  ): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    return Promise.resolve(
      this.presign('PUT', destPath, expires, {
        partNumber: String(index + 1),
        uploadId: ossUploadId,
      }),
    );
  }

  private objectUrl(objectKey: string, query?: Record<string, string>): string {
    const qs = this.encodeQuery(query, false);
    return `https://${this.opts.bucket}.${this.opts.endpoint}/${objectKey}${qs ? `?${qs}` : ''}`;
  }

  private encodeQuery(
    query: Record<string, string> | undefined,
    canonical: boolean,
  ): string {
    if (!query) return '';
    const keys = Object.keys(query).sort();
    return keys
      .map((k) => {
        if (canonical && !SIGNED_SUBRESOURCES.has(k)) return '';
        const v = query[k];
        if (canonical) {
          return v === '' ? k : `${k}=${v}`;
        }
        return v === '' ? k : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
      })
      .filter(Boolean)
      .join('&');
  }

  private sign(
    method: string,
    objectKey: string,
    dateOrExpires: string,
    mime: string,
    extraHeaders: Record<string, string>,
    query?: Record<string, string>,
  ): string {
    const ossHeaders = Object.keys(extraHeaders)
      .filter((k) => k.toLowerCase().startsWith('x-oss-'))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k.toLowerCase()}:${extraHeaders[k]}\n`)
      .join('');
    const resourceQuery = this.encodeQuery(query, true);
    const resource = `/${this.opts.bucket}/${objectKey}${resourceQuery ? `?${resourceQuery}` : ''}`;
    const stringToSign = `${method}\n\n${mime}\n${dateOrExpires}\n${ossHeaders}${resource}`;
    return createHmac('sha1', this.opts.accessKeySecret)
      .update(stringToSign)
      .digest('base64');
  }

  private presign(
    method: string,
    objectKey: string,
    expires: number,
    query: Record<string, string> = {},
  ): string {
    const signature = this.sign(method, objectKey, String(expires), '', {}, query);
    const allQuery = {
      ...query,
      OSSAccessKeyId: this.opts.accessKeyId,
      Expires: String(expires),
      Signature: signature,
    };
    return this.objectUrl(objectKey, allQuery);
  }

  private async ossRequest(opts: {
    method: string;
    objectKey: string;
    query?: Record<string, string>;
    mime?: string;
    extraHeaders?: Record<string, string>;
    data?: unknown;
    responseType?: 'arraybuffer' | 'stream' | 'text';
    accept404?: boolean;
  }): Promise<AxiosResponse> {
    const mime = opts.mime ?? '';
    const date = new Date().toUTCString();
    const extraHeaders = opts.extraHeaders || {};
    const signature = this.sign(
      opts.method,
      opts.objectKey,
      date,
      mime,
      extraHeaders,
      opts.query,
    );
    const headers: Record<string, string> = {
      Date: date,
      Authorization: `OSS ${this.opts.accessKeyId}:${signature}`,
      ...extraHeaders,
    };
    if (mime) headers['Content-Type'] = mime;
    if (Buffer.isBuffer(opts.data)) {
      headers['Content-MD5'] = createHash('md5')
        .update(opts.data)
        .digest('base64');
      // Content-MD5 is in stringToSign second field — we signed with empty MD5.
      // Aliyun allows empty Content-MD5. Do not send if not in signature.
      delete headers['Content-MD5'];
    }
    return axios.request({
      method: opts.method,
      url: this.objectUrl(opts.objectKey, opts.query),
      headers,
      data: opts.data,
      responseType: opts.responseType,
      maxBodyLength: Infinity,
      timeout: 120_000,
      validateStatus: (s) =>
        (s >= 200 && s < 300) || Boolean(opts.accept404 && s === 404),
    });
  }
}
