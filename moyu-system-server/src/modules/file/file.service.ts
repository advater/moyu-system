import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  FilePageReqDTO,
  FileResDTO,
  FileUploadCompleteResDTO,
  FileUploadInitReqDTO,
  FileUploadInitResDTO,
  FileUploadMergeReqDTO,
  FileUploadResDTO,
  FileUploadStatusResDTO,
} from './dto/file.dto';
import { FileRepository } from './repositories/file.repository';
import { FileUploadRepository } from './repositories/file-upload.repository';
import { FileDO, FileUploadDO } from './entities/file.entity';
import { createFileStorage } from './file-storage.factory';
import type {
  ByteRange,
  FileStorage,
  UploadSessionMeta,
} from './file-storage.interface';
import { OssFileStorage } from './oss-file.storage';
import {
  fileExtension,
  matchesAllowedTypes,
  mimeFromExt,
  parseDataUrlBase64,
} from './file-validate';
import { getFileConfig } from '@/config/file.config';
import { FileError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { RedisService } from '@/plugins/redis/redis.service';
import { i18nKey } from '@/i18n';
import { md5Buffer, md5File, md5JoinedChunkHashes } from './file-hash.util';
import { missingIndexes } from './file-chunk.util';
import { safeUnlink } from './file-fs.util';
import { LocalFileStorage } from './local-file.storage';
import { randomUUID, randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { Readable } from 'node:stream';

const HASH_MEDIUM = 'chunk_medium';
const HASH_LARGE = 'chunk_large';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly storage: FileStorage = createFileStorage();
  private readonly mergeInflight = new Map<
    string,
    Promise<FileUploadCompleteResDTO>
  >();

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly uploadRepository: FileUploadRepository,
    private readonly tenantPolicyService: TenantPolicyService,
    private readonly redisService: RedisService,
  ) {}

  private currentTenantId(): string {
    return TenantContext.requireTenantId();
  }

  private redisKey(uploadId: string): string {
    return `file:chunk:${this.currentTenantId()}:${uploadId}`;
  }

  private redisHashKey(uploadId: string): string {
    return `file:chunkhash:${this.currentTenantId()}:${uploadId}`;
  }

  /**
   * 上传文件。allowedTypes 未传或为空则不限制类型。
   */
  async upload(
    buffer: Buffer,
    filename: string,
    mimeHint?: string,
    allowedTypes?: string[],
  ): Promise<FileUploadResDTO> {
    if (!buffer?.length) {
      throw new HttpException(FileError.EMPTY, HttpStatus.BAD_REQUEST);
    }
    const cfg = getFileConfig();
    if (buffer.length > cfg.maxFileSize) {
      throw new HttpException(FileError.TOO_LARGE, HttpStatus.BAD_REQUEST);
    }
    const { ext, mime } = this.assertFileMeta(filename, mimeHint, allowedTypes);
    const hash = md5Buffer(buffer);
    const tenantId = this.currentTenantId();
    return this.tenantPolicyService.withStorageQuotaLock(tenantId, () =>
      this.persistNewFile({
        filename,
        mime,
        ext,
        size: buffer.length,
        hash,
        writer: async (relativePath) => {
          await this.storage.save(relativePath, buffer, mime);
        },
      }),
    );
  }

  async uploadBase64(
    dataUrl: string,
    filename: string,
  ): Promise<FileUploadResDTO> {
    let parsed: ReturnType<typeof parseDataUrlBase64>;
    try {
      parsed = parseDataUrlBase64(dataUrl);
    } catch {
      throw new HttpException(FileError.INVALID_BASE64, HttpStatus.BAD_REQUEST);
    }
    const cfg = getFileConfig();
    if (parsed.byteLength > cfg.base64MaxSize) {
      throw new HttpException(
        FileError.BASE64_TOO_LARGE,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.upload(parsed.buffer, filename, parsed.mime);
  }

  async initUpload(
    req: FileUploadInitReqDTO,
    creator?: string,
  ): Promise<FileUploadInitResDTO> {
    const cfg = getFileConfig();
    const { ext, mime } = this.assertFileMeta(
      req.name,
      req.mime,
      req.allowedTypes,
    );
    if (req.size > cfg.maxLargeFileSize) {
      throw new HttpException(FileError.TOO_LARGE, HttpStatus.BAD_REQUEST);
    }
    const hashType =
      req.hashType === HASH_LARGE || req.size > 100 * 1024 * 1024
        ? HASH_LARGE
        : HASH_MEDIUM;

    const existed = req.hash
      ? await this.fileRepository.selectByHash(req.hash)
      : null;
    if (existed?.path) {
      try {
        const head = await this.storage.head(existed.path);
        if (head.size > 0 && head.size === req.size) {
          const linked = await this.tenantPolicyService.withStorageQuotaLock(
            this.currentTenantId(),
            () =>
              this.persistNewFile({
                filename: req.name,
                mime,
                ext,
                size: req.size,
                hash: req.hash,
                relativePath: existed.path,
                writer: () => Promise.resolve(),
              }),
          );
          return {
            fileId: linked.id,
            url: linked.url,
            name: linked.name,
            type: linked.type,
            size: linked.size,
            chunkSize: cfg.maxChunkSize,
            totalChunks: 0,
            uploadedIndexes: [],
            hashType,
          };
        }
      } catch {
        /* 物理文件已不在，走正常分片上传 */
      }
    }

    const tenantId = this.currentTenantId();
    return this.tenantPolicyService.withStorageQuotaLock(tenantId, async () => {
      await this.tenantPolicyService.assertStorageQuota(tenantId, req.size);

      const active = await this.uploadRepository.selectActiveByHash(
        req.hash,
        creator,
      );
      if (active && active.expireAt > new Date()) {
        const uploaded = await this.loadUploadedIndexes(active);
        return this.toInitRes(active, uploaded);
      }

      const totalChunks = Math.max(1, Math.ceil(req.size / cfg.maxChunkSize));
      const destPath = this.storage.buildRelativePath(req.hash, ext, tenantId);
    const uploadId = randomUUID();
    const sessionMeta: UploadSessionMeta = {
      uploadId,
      destPath,
      mime,
      totalChunks,
    };
    let ossUploadId: string | undefined;
    let partUrls: string[] | undefined;
    if (this.storage.createUploadSession) {
      const created = await this.storage.createUploadSession(sessionMeta);
      ossUploadId = created.ossUploadId;
      partUrls = created.partUrls;
    }

    const row = await this.uploadRepository.insert({
      uploadId,
      tenantId,
      name: req.name.slice(0, 256),
      mime,
      ext,
      size: req.size,
      hash: req.hash,
      hashType,
      chunkSize: cfg.maxChunkSize,
      totalChunks,
      uploadedIndexes: [],
      storageKind: this.storage.kind,
      ossUploadId,
      destPath,
      status: 'init',
      expireAt: new Date(Date.now() + cfg.chunkUploadTTL),
      creator: creator ?? null,
    });
    return { ...this.toInitRes(row, []), partUrls };
    });
  }

  async getUploadStatus(query: {
    uploadId?: string;
    hash?: string;
    creator?: string;
  }): Promise<FileUploadStatusResDTO> {
    const session = await this.resolveSession(query);
    const uploaded = await this.loadUploadedIndexes(session);
    return {
      uploadId: session.uploadId,
      uploadedIndexes: uploaded,
      missingIndexes: missingIndexes(session.totalChunks, uploaded),
      totalChunks: session.totalChunks,
      chunkSize: session.chunkSize,
      readyToMerge: uploaded.length === session.totalChunks,
    };
  }

  async saveChunk(params: {
    buffer: Buffer;
    chunkName: string;
    chunkHash: string;
    chunkIndex: number;
    totalChunks: number;
    fileName: string;
    fileHash: string;
    hashType?: string;
    uploadId?: string;
    creator?: string;
  }): Promise<{
    message: string;
    readyToMerge?: boolean;
    uploadId: string;
    uploadedIndexes: number[];
    missingIndexes: number[];
    totalChunks: number;
    id?: number;
    url?: string;
  }> {
    const cfg = getFileConfig();
    if (!params.buffer?.length) {
      throw new HttpException(FileError.CHUNK_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    if (params.buffer.length > Math.max(cfg.maxChunkFileSize, cfg.maxChunkSize)) {
      throw new HttpException(FileError.TOO_LARGE, HttpStatus.BAD_REQUEST);
    }
    const actualHash = md5Buffer(params.buffer);
    if (params.chunkHash && params.chunkHash !== actualHash) {
      throw new HttpException(
        i18nKey(FileError.CHUNK_MISMATCH, { chunkName: params.chunkName }),
        HttpStatus.BAD_REQUEST,
      );
    }

    let session: FileUploadDO;
    try {
      session = await this.resolveSession({
        uploadId: params.uploadId,
        hash: params.fileHash,
        creator: params.creator,
      });
    } catch {
      const inited = await this.initUpload(
        {
          name: params.fileName,
          size: params.totalChunks * cfg.maxChunkSize,
          hash: params.fileHash,
          hashType: params.hashType,
        },
        params.creator,
      );
      if (inited.fileId) {
        return {
          message: '秒传成功',
          uploadId: inited.uploadId || '',
          uploadedIndexes: [],
          missingIndexes: [],
          totalChunks: 0,
          id: inited.fileId,
          url: inited.url,
        };
      }
      session = await this.resolveSession({
        uploadId: inited.uploadId,
        hash: params.fileHash,
        creator: params.creator,
      });
    }

    this.assertSessionWritable(session);
    if (
      params.chunkIndex < 0 ||
      params.chunkIndex >= session.totalChunks
    ) {
      throw new HttpException(
        FileError.CHUNK_INDEX_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    const already = await this.loadUploadedIndexes(session);
    if (!already.includes(params.chunkIndex)) {
      try {
        const result = await this.storage.saveChunk(
          session.uploadId,
          params.chunkIndex,
          params.buffer,
          this.toStorageMeta(session),
        );
        if (result.etag) {
          const etags = [...(session.partEtags || [])];
          const partNumber = params.chunkIndex + 1;
          const rest = etags.filter((p) => p.partNumber !== partNumber);
          rest.push({ etag: result.etag, partNumber });
          session.partEtags = rest;
          await this.uploadRepository.updateByUploadId(session.uploadId, {
            partEtags: rest,
          });
        }
      } catch (error) {
        throw new HttpException(
          i18nKey(FileError.CHUNK_SAVE_FAILED, { error: String(error) }),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.persistChunkHash(
        session.uploadId,
        params.chunkIndex,
        actualHash,
      );
    }
    const unique = await this.addUploadedIndex(session, params.chunkIndex);
    const miss = missingIndexes(session.totalChunks, unique);
    const done = miss.length === 0;
    if (done) {
      void this.ensureMerge(session, {
        uploadId: session.uploadId,
        fileHash: session.hash,
      }).catch((error) => {
        this.logger.warn(
          `auto merge ${session.uploadId} failed: ${String(error)}`,
        );
      });
    }
    return {
      message: done
        ? '分片已齐，服务端开始合并'
        : `${params.chunkName} 分片上传成功`,
      uploadId: session.uploadId,
      readyToMerge: done,
      uploadedIndexes: unique,
      missingIndexes: miss,
      totalChunks: session.totalChunks,
    };
  }

  async completeUpload(
    req: FileUploadMergeReqDTO,
    creator?: string,
  ): Promise<FileUploadCompleteResDTO> {
    const session = await this.resolveSession({
      uploadId: req.uploadId,
      hash: req.fileHash,
      creator,
    });
    if (session.status === 'completed' && session.fileId) {
      const row = await this.fileRepository.selectById(session.fileId);
      if (row) return this.toUploadRes(row);
    }
    this.assertSessionWritable(session);
    if (session.status === 'merging') {
      return this.followMerge(session);
    }
    const claimed = await this.uploadRepository.tryBeginMerge(session.uploadId);
    if (!claimed) {
      const latest = await this.resolveSession({
        uploadId: session.uploadId,
        hash: req.fileHash,
        creator,
      });
      if (latest.status === 'completed' && latest.fileId) {
        const row = await this.fileRepository.selectById(latest.fileId);
        if (row) return this.toUploadRes(row);
      }
      return this.followMerge(latest);
    }
    return this.ensureMerge(session, req);
  }

  async abortUpload(query: {
    uploadId?: string;
    fileHash?: string;
    creator?: string;
  }): Promise<boolean> {
    const session = await this.resolveSession({
      uploadId: query.uploadId,
      hash: query.fileHash,
      creator: query.creator,
    });
    this.assertSessionWritable(session);
    if (session.status === 'merging') {
      throw new HttpException(FileError.SESSION_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    await this.cleanupSessionStorage(session);
    await this.uploadRepository.updateByUploadId(session.uploadId, {
      status: 'aborted',
    });
    await this.redisService.delete(this.redisKey(session.uploadId));
    await this.redisService.delete(this.redisHashKey(session.uploadId));
    return true;
  }

  async getPartUrl(uploadId: string, index: number, creator?: string) {
    const session = await this.resolveSession({ uploadId, creator });
    if (!(this.storage instanceof OssFileStorage) || !session.ossUploadId) {
      return { url: '' };
    }
    const url = await this.storage.presignPartUrl(
      session.destPath,
      session.ossUploadId,
      index,
    );
    return { url };
  }

  async cleanupExpiredSessions(): Promise<number> {
    const prev = TenantContext.isIgnored();
    TenantContext.setIgnore(true);
    let cleaned = 0;
    try {
      let afterId = 0;
      for (;;) {
        const expired = await this.uploadRepository.selectExpired(
          new Date(),
          200,
          afterId,
        );
        if (!expired.length) break;
        for (const session of expired) {
          afterId = Math.max(afterId, session.id);
          try {
            await this.cleanupSessionStorage(session);
            await this.uploadRepository.updateByUploadId(session.uploadId, {
              status: 'expired',
            });
            cleaned += 1;
          } catch (err) {
            this.logger.warn(`cleanup upload ${session.uploadId} failed: ${err}`);
          }
        }
        if (cleaned >= 5000) break;
      }
      cleaned += await this.purgeSoftDeletedBlobs();
      return cleaned;
    } finally {
      TenantContext.setIgnore(prev);
    }
  }

  private async purgeSoftDeletedBlobs(): Promise<number> {
    const ttl = getFileConfig().softDeleteTTL;
    if (ttl <= 0) return 0;
    const cutoff = new Date(Date.now() - ttl);
    let purged = 0;
    let afterId = 0;
    for (;;) {
      const rows = await this.fileRepository.selectDeletedBefore(
        cutoff,
        200,
        afterId,
      );
      if (!rows.length) break;
      for (const row of rows) {
        afterId = Math.max(afterId, row.id);
        try {
          const live = await this.fileRepository.countLiveByPath(row.path);
          if (live === 0 && row.path) {
            await this.storage.remove(row.path);
            purged += 1;
          }
        } catch (err) {
          this.logger.warn(`purge blob ${row.path} failed: ${err}`);
        }
      }
      if (purged >= 2000) break;
    }
    return purged;
  }

  async getFile(id: number): Promise<FileResDTO> {
    const row = await this.requireFile(id);
    return this.toResDTO(row);
  }

  async issuePreviewTicket(id: number): Promise<{
    ticket: string;
    expiresIn: number;
    fileId: number;
  }> {
    await this.requireFile(id);
    const ticket = randomBytes(24).toString('hex');
    const expiresIn = getFileConfig().previewTicketTTL;
    await this.redisService.set(
      this.previewTicketKey(ticket),
      { fileId: id, tenantId: this.currentTenantId() },
      expiresIn,
    );
    return { ticket, expiresIn, fileId: id };
  }

  async applyPreviewTicket(ticket: string, fileId: number): Promise<void> {
    const payload = await this.redisService.get<{
      fileId: number;
      tenantId: string;
    }>(this.previewTicketKey(ticket));
    if (
      !payload?.tenantId ||
      Number(payload.fileId) !== Number(fileId)
    ) {
      throw new HttpException(FileError.TICKET_INVALID, HttpStatus.FORBIDDEN);
    }
    TenantContext.setTenantId(payload.tenantId);
  }

  private previewTicketKey(ticket: string): string {
    return `file:preview-ticket:${ticket}`;
  }

  async getFilePage(query: FilePageReqDTO): Promise<PageResult<FileResDTO>> {
    const where = {
      ...(query.name ? { name: { contains: query.name } } : {}),
      ...(query.type ? { type: { startsWith: query.type } } : {}),
    };
    const { list, total } = await this.fileRepository.selectPage(
      { page: query.page, pageSize: query.pageSize },
      where,
    );
    return { list: list.map((r) => this.toResDTO(r)), total };
  }

  async deleteFile(id: number): Promise<boolean> {
    await this.requireFile(id);
    return this.fileRepository.deleteById(id);
  }

  async deleteFileList(ids: number[]): Promise<boolean> {
    if (!ids?.length) return false;
    for (const id of ids) {
      await this.deleteFile(id);
    }
    return true;
  }

  async headContent(id: number, disposition: 'inline' | 'attachment') {
    const row = await this.requireFile(id);
    const head = await this.storage.head(row.path);
    const downloadUrl = this.storage.getDownloadUrl
      ? await this.storage.getDownloadUrl(row.id, row.path, disposition, row.name)
      : null;
    return {
      name: row.name,
      type: row.type || 'application/octet-stream',
      size: head.size || Number(row.size),
      downloadUrl,
    };
  }

  async openContentRange(
    id: number,
    range: ByteRange | undefined,
    disposition: 'inline' | 'attachment',
  ): Promise<{
    stream: Readable;
    name: string;
    type: string;
    size: number;
    range?: ByteRange;
    downloadUrl: string | null;
  }> {
    const row = await this.requireFile(id);
    const signed = this.storage.getDownloadUrl
      ? await this.storage.getDownloadUrl(
          row.id,
          row.path,
          disposition,
          row.name,
        )
      : null;
    const head = await this.storage.head(row.path);
    const stream = await this.storage.createReadStream(row.path, range);
    return {
      stream,
      name: row.name,
      type: row.type || 'application/octet-stream',
      size: head.size || Number(row.size),
      range,
      downloadUrl: signed,
    };
  }

  /** 兼容旧 preview：小文件仍可读 buffer */
  async readContent(
    id: number,
  ): Promise<{ buffer: Buffer; name: string; type: string }> {
    const row = await this.requireFile(id);
    const buffer = await this.storage.read(row.path);
    return {
      buffer,
      name: row.name,
      type: row.type || 'application/octet-stream',
    };
  }

  private async persistNewFile(params: {
    filename: string;
    mime: string;
    ext: string;
    size: number;
    hash: string;
    relativePath?: string;
    writer: (relativePath: string) => Promise<void>;
    skipQuota?: boolean;
  }): Promise<FileUploadResDTO> {
    const blob = params.hash
      ? await this.fileRepository.selectByHash(params.hash)
      : null;
    let relativePath = params.relativePath || blob?.path;
    let needWrite = true;
    if (blob?.path) {
      try {
        const head = await this.storage.head(blob.path);
        if (head.size > 0) {
          relativePath = blob.path;
          needWrite = false;
        }
      } catch {
        needWrite = true;
      }
    }
    const tenantId = this.currentTenantId();
    if (!params.skipQuota) {
      await this.tenantPolicyService.assertStorageQuota(tenantId, params.size);
    }
    relativePath =
      relativePath ||
      this.storage.buildRelativePath(params.hash, params.ext, tenantId);
    if (needWrite) {
      try {
        await params.writer(relativePath);
      } catch {
        throw new HttpException(
          FileError.WRITE_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    const id = await this.fileRepository.insert({
      tenantId,
      name: params.filename.slice(0, 256),
      path: relativePath,
      url: '',
      type: params.mime,
      size: BigInt(params.size),
      hash: params.hash,
      storageKind: this.storage.kind,
    });
    const url = this.storage.buildUrl(id, relativePath);
    await this.fileRepository.updateById(id, { url });
    const resp = new FileUploadResDTO();
    resp.id = id;
    resp.url = url;
    resp.name = params.filename;
    resp.type = params.mime;
    resp.size = params.size;
    return resp;
  }

  private assertFileMeta(
    filename: string,
    mimeHint?: string,
    allowedTypes?: string[],
  ) {
    const ext = fileExtension(filename);
    const mime =
      mimeHint && mimeHint.includes('/') ? mimeHint : mimeFromExt(ext);
    if (
      Array.isArray(allowedTypes) &&
      allowedTypes.length > 0 &&
      !matchesAllowedTypes(filename, mime, allowedTypes)
    ) {
      throw new HttpException(
        FileError.TYPE_NOT_ALLOWED,
        HttpStatus.BAD_REQUEST,
      );
    }
    return { ext, mime };
  }

  private async resolveSession(query: {
    uploadId?: string;
    hash?: string;
    creator?: string;
  }): Promise<FileUploadDO> {
    let row: FileUploadDO | null = null;
    if (query.uploadId) {
      row = await this.uploadRepository.selectByUploadId(query.uploadId);
    } else if (query.hash) {
      row = await this.uploadRepository.selectActiveByHash(
        query.hash,
        query.creator,
      );
    }
    if (!row) {
      throw new HttpException(
        FileError.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (query.creator && row.creator && row.creator !== query.creator) {
      throw new HttpException(
        FileError.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private assertSessionWritable(session: FileUploadDO) {
    if (session.expireAt.getTime() < Date.now()) {
      throw new HttpException(FileError.SESSION_EXPIRED, HttpStatus.BAD_REQUEST);
    }
    if (['completed', 'aborted', 'expired'].includes(session.status)) {
      throw new HttpException(
        FileError.SESSION_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async loadUploadedIndexes(session: FileUploadDO): Promise<number[]> {
    const fromRedis = await this.redisService.sMembers(
      this.redisKey(session.uploadId),
    );
    const indexes = fromRedis
      ? fromRedis.map(Number).filter((n) => Number.isInteger(n))
      : [...(session.uploadedIndexes || [])];
    if (this.storage instanceof LocalFileStorage) {
      const disk = await this.storage.listChunkIndexes(session.uploadId);
      indexes.push(...disk);
    }
    return [...new Set(indexes)].sort((a, b) => a - b);
  }

  private async addUploadedIndex(
    session: FileUploadDO,
    index: number,
  ): Promise<number[]> {
    const cfg = getFileConfig();
    const members = await this.redisService.sAddMembers(
      this.redisKey(session.uploadId),
      String(index),
      cfg.chunkUploadTTL,
    );
    const unique = members
      .map(Number)
      .filter((n) => Number.isInteger(n))
      .sort((a, b) => a - b);
    await this.uploadRepository.updateByUploadId(session.uploadId, {
      uploadedIndexes: unique,
      status: 'uploading',
    });
    return unique;
  }

  private async persistIndexes(session: FileUploadDO, uploaded: number[]) {
    const unique = [...new Set(uploaded)].sort((a, b) => a - b);
    const cfg = getFileConfig();
    await this.redisService.replaceSet(
      this.redisKey(session.uploadId),
      unique.map(String),
      cfg.chunkUploadTTL,
    );
    await this.uploadRepository.updateByUploadId(session.uploadId, {
      uploadedIndexes: unique,
      status: 'uploading',
    });
  }

  private incompleteUpload(
    session: FileUploadDO,
    uploaded: number[],
    missing: number[],
  ): FileUploadCompleteResDTO {
    return {
      incomplete: true,
      uploadId: session.uploadId,
      missingIndexes: missing,
      uploadedIndexes: uploaded,
      totalChunks: session.totalChunks,
      id: 0,
      url: '',
      name: session.name,
      size: Number(session.size),
    };
  }

  private async followMerge(
    session: FileUploadDO,
  ): Promise<FileUploadCompleteResDTO> {
    const hit = this.mergeInflight.get(session.uploadId);
    if (hit) return hit;
    for (let i = 0; i < 600; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const latest = await this.uploadRepository.selectByUploadId(
        session.uploadId,
      );
      if (!latest) {
        throw new HttpException(FileError.SESSION_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      if (latest.status === 'completed' && latest.fileId) {
        const row = await this.fileRepository.selectById(latest.fileId);
        if (row) return this.toUploadRes(row);
      }
      if (latest.status !== 'merging') {
        throw new HttpException(
          i18nKey(FileError.MERGE_FAILED, { error: latest.status }),
          HttpStatus.CONFLICT,
        );
      }
    }
    throw new HttpException(
      i18nKey(FileError.MERGE_FAILED, { error: 'timeout' }),
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }

  private ensureMerge(
    session: FileUploadDO,
    req: FileUploadMergeReqDTO,
  ): Promise<FileUploadCompleteResDTO> {
    const hit = this.mergeInflight.get(session.uploadId);
    if (hit) return hit;
    const run = this.runComplete(session, req).finally(() => {
      this.mergeInflight.delete(session.uploadId);
    });
    this.mergeInflight.set(session.uploadId, run);
    return run;
  }

  private async runComplete(
    session: FileUploadDO,
    _req: FileUploadMergeReqDTO,
  ): Promise<FileUploadCompleteResDTO> {
    const uploaded = await this.loadUploadedIndexes(session);
    const miss = missingIndexes(session.totalChunks, uploaded);
    if (miss.length) {
      await this.uploadRepository.updateByUploadId(session.uploadId, {
        status: 'uploading',
      });
      return this.incompleteUpload(session, uploaded, miss);
    }
    const bad = await this.inspectChunkIntegrity(session);
    if (bad.length) {
      const keep = uploaded.filter((i) => !bad.includes(i));
      await this.persistIndexes(session, keep);
      return this.incompleteUpload(
        session,
        keep,
        missingIndexes(session.totalChunks, keep),
      );
    }

    try {
      if (this.storage.kind === 'oss') {
        const parts = session.partEtags || [];
        await this.storage.completeUploadSession?.(
          this.toStorageMeta(session),
          parts,
        );
      } else {
        await this.storage.mergeChunks(
          session.uploadId,
          session.destPath,
          session.totalChunks,
          session.mime,
        );
      }
      await this.verifyMergedHash(session);
    } catch (error) {
      await this.uploadRepository.updateByUploadId(session.uploadId, {
        status: 'uploading',
      });
      if (this.storage instanceof LocalFileStorage) {
        await safeUnlink(this.storage.absolutePath(session.destPath));
        const broken = await this.inspectChunkIntegrity(session);
        const latest = await this.loadUploadedIndexes(session);
        const keep = latest.filter((i) => !broken.includes(i));
        if (broken.length) await this.persistIndexes(session, keep);
        return this.incompleteUpload(
          session,
          broken.length ? keep : latest,
          broken.length
            ? missingIndexes(session.totalChunks, keep)
            : missingIndexes(session.totalChunks, latest),
        );
      }
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        i18nKey(FileError.MERGE_FAILED, {
          error: (error as Error).message,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }

    const file = await this.persistNewFile({
      filename: session.name,
      mime: session.mime,
      ext: session.ext,
      size: Number(session.size),
      hash: session.hash,
      relativePath: session.destPath,
      writer: () => Promise.resolve(),
      skipQuota: true,
    });
    await this.uploadRepository.updateByUploadId(session.uploadId, {
      status: 'completed',
      fileId: file.id,
    });
    await this.cleanupSessionStorage(session);
    await this.redisService.delete(this.redisKey(session.uploadId));
    await this.redisService.delete(this.redisHashKey(session.uploadId));
    return file;
  }

  private toStorageMeta(session: FileUploadDO): UploadSessionMeta {
    return {
      uploadId: session.uploadId,
      destPath: session.destPath,
      mime: session.mime,
      totalChunks: session.totalChunks,
      ossUploadId: session.ossUploadId || undefined,
    };
  }

  private toInitRes(
    session: FileUploadDO,
    uploaded: number[],
  ): FileUploadInitResDTO {
    return {
      uploadId: session.uploadId,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedIndexes: uploaded,
      missingIndexes: missingIndexes(session.totalChunks, uploaded),
      hashType: session.hashType,
      readyToMerge: uploaded.length === session.totalChunks,
    };
  }

  private async persistChunkHash(
    uploadId: string,
    index: number,
    hash: string,
  ) {
    const cfg = getFileConfig();
    await this.redisService.hSetField(
      this.redisHashKey(uploadId),
      String(index),
      hash,
      cfg.chunkUploadTTL,
    );
  }

  private async inspectChunkIntegrity(session: FileUploadDO): Promise<number[]> {
    const uploaded = await this.loadUploadedIndexes(session);
    const missing = missingIndexes(session.totalChunks, uploaded);
    if (
      this.storage.kind !== 'local' ||
      !(this.storage instanceof LocalFileStorage)
    ) {
      return missing;
    }
    const expected = await this.redisService.hGetAllFields(
      this.redisHashKey(session.uploadId),
    );
    const bad = [...missing];
    for (const index of uploaded) {
      const abs = join(
        process.cwd(),
        getFileConfig().chunkDir,
        session.uploadId,
        String(index),
      );
      try {
        const actual = await md5File(abs);
        const want = expected[String(index)];
        if (want && want !== actual) {
          bad.push(index);
          await safeUnlink(abs);
        }
      } catch {
        bad.push(index);
        await safeUnlink(abs);
      }
    }
    return [...new Set(bad)].sort((a, b) => a - b);
  }

  private async verifyMergedHash(session: FileUploadDO) {
    if (this.storage.kind === 'oss') return;
    if (!(this.storage instanceof LocalFileStorage)) return;
    const destAbs = this.storage.absolutePath(session.destPath);
    if (session.hashType === HASH_MEDIUM) {
      const merged = await md5File(destAbs);
      if (merged !== session.hash) {
        throw new HttpException(
          FileError.MERGE_HASH_MISMATCH,
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }
    const stored = await this.redisService.hGetAllFields(
      this.redisHashKey(session.uploadId),
    );
    const hashes: string[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const remembered = stored[String(i)];
      hashes.push(
        remembered ||
          (await md5File(
            join(
              process.cwd(),
              getFileConfig().chunkDir,
              session.uploadId,
              String(i),
            ),
          )),
      );
    }
    if (md5JoinedChunkHashes(hashes) !== session.hash) {
      throw new HttpException(
        FileError.MERGE_HASH_MISMATCH,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async cleanupSessionStorage(session: FileUploadDO) {
    try {
      if (session.status !== 'completed') {
        await this.storage.abortUploadSession?.(this.toStorageMeta(session));
      }
      await this.storage.removeChunks?.(session.uploadId);
    } catch {
      /* ignore */
    }
  }

  private async requireFile(id: number): Promise<FileDO> {
    const row = await this.fileRepository.selectById(id);
    if (!row) {
      throw new HttpException(FileError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private toUploadRes(row: FileDO): FileUploadResDTO {
    const resp = new FileUploadResDTO();
    resp.id = row.id;
    resp.url = row.url || this.storage.buildUrl(row.id, row.path);
    resp.name = row.name;
    resp.type = row.type ?? undefined;
    resp.size = Number(row.size);
    return resp;
  }

  private toResDTO(row: FileDO): FileResDTO {
    const resp = new FileResDTO();
    resp.id = row.id;
    resp.name = row.name;
    resp.path = row.path;
    resp.url = row.url || this.storage.buildUrl(row.id, row.path);
    resp.type = row.type ?? undefined;
    resp.size = Number(row.size);
    resp.createTime = formatDate(row.createTime);
    return resp;
  }
}
