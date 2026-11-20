/**
 * 分片上传：主线程切片 → Worker 算每片 MD5 → 并发上传。
 * 片数与总数对齐后才通知合并；缺片只补传，不进合并。
 */
import Token from "@/utils/token";
import { getTenantId } from "@/utils/auth";
import { request, trySilentRefresh } from "@/utils/request";
import { resolveFileApiBase } from "@/config/env";
import { uploadFile as apiUploadFile } from "@/api/system/file";
import { updateUserProfileAvatar } from "@/api/system/user/profile";
import { ssoMessage } from "@/utils/index";
import {
  calculateTotalHashWithChunks,
  hashChunksWithWorker,
  isAbortError,
  abortError,
  sliceChunk,
  type FileChunkMeta,
} from "./chunk";

export type TransferPhase = "hashing" | "uploading" | "merging" | "paused" | "error" | "success";

type ProgressCallback = (percent: number) => void;

export type UploadProgressCallback = (
  percent: number,
  status: "uploading" | "success" | "error",
  phase?: TransferPhase,
) => void;

export interface UploadOptions {
  onProgress?: UploadProgressCallback;
  maxSize?: number;
  /** 未传或空数组表示允许所有类型 */
  allowedTypes?: string[];
  signal?: AbortSignal;
}

export interface LargeUploadResult {
  id?: number;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  incomplete?: boolean;
  missingIndexes?: number[];
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSize: 2,
};

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const DEFAULT_MAX_CONCURRENTS = 3;
const SMALL_FILE_SIZE = 50 * 1024 * 1024;

function fileMatchesAllowed(file: File, allowedTypes?: string[]) {
  if (!allowedTypes?.length) return true;
  const mime = (file.type || "").toLowerCase();
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return allowedTypes.some((item) => {
    const rule = item.trim().toLowerCase();
    if (!rule) return false;
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    if (rule.includes("/")) return mime === rule || ext === rule.split("/")[1];
    return ext === rule.replace(/^\./, "");
  });
}

function validateFile(file: File, options: UploadOptions) {
  if (options.allowedTypes?.length && !fileMatchesAllowed(file, options.allowedTypes)) {
    const msg = `不支持的文件类型: ${file.type || file.name}`;
    ssoMessage(msg);
    throw new Error(msg);
  }
  if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
    const msg = `文件大小不能超过 ${options.maxSize}MB`;
    ssoMessage(msg);
    throw new Error(msg);
  }
}

async function uploadFileHandler(
  file: File,
  uploadFn: (file: File) => Promise<any>,
  options: UploadOptions,
): Promise<string> {
  validateFile(file, options);
  options.onProgress?.(0, "uploading");
  try {
    const res = await uploadFn(file);
    const url = typeof res === "string" ? res : res?.url;
    if (!url) {
      options.onProgress?.(0, "error");
      ssoMessage("上传失败");
      throw new Error("Upload failed");
    }
    options.onProgress?.(100, "success");
    return url;
  } catch (error) {
    options.onProgress?.(0, "error");
    throw error;
  }
}

export async function uploadUserAvatar(file: File, options: UploadOptions = {}): Promise<string> {
  return uploadFileHandler(file, updateUserProfileAvatar, {
    ...DEFAULT_OPTIONS,
    ...options,
    maxSize: 2,
    allowedTypes: options.allowedTypes?.length
      ? options.allowedTypes
      : ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp", "image/bmp"],
  });
}

export async function uploadUserImage(file: File, options: UploadOptions = {}): Promise<string> {
  return uploadFileHandler(file, apiUploadFile, { ...DEFAULT_OPTIONS, ...options });
}

export async function uploadUserFile(file: File, options: UploadOptions = {}): Promise<string> {
  return uploadFileHandler(file, (f) => uploadBySize(f, options.onProgress, options.signal, options.allowedTypes), {
    maxSize: 5 * 1024,
    ...options,
  });
}

function xhrUpload(props: {
  url: string;
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  progressCallback?: ProgressCallback;
  signal?: AbortSignal;
}): Promise<any> {
  const { url, method = "post", data, headers = {}, progressCallback, signal } = props;

  const sendOnce = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.withCredentials = true;
      xhr.timeout = 120000;
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        fn();
      };
      const onAbort = () => {
        xhr.abort();
        finish(() => reject(abortError()));
      };
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener("abort", onAbort);

      const nextHeaders: Record<string, string> = {
        domainName: window.location.host,
        Authorization: `Bearer ${Token.getToken()}`,
        ...headers,
      };
      const tenantId = getTenantId();
      if (tenantId) nextHeaders["tenant-id"] = tenantId;
      Object.entries(nextHeaders).forEach(([key, value]) => {
        if (value) xhr.setRequestHeader(key, value);
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        if (signal?.aborted) {
          finish(() => reject(abortError()));
          return;
        }
        if (xhr.status === 0) {
          finish(() => reject({ code: 400, message: "Upload error" }));
          return;
        }
        let body: any = {};
        try {
          body = JSON.parse(xhr.responseText || "{}");
        } catch {
          body = {};
        }
        if (xhr.status < 200 || xhr.status >= 300 || (body.code && (body.code < 200 || body.code >= 300))) {
          finish(() =>
            reject({
              code: body.code || xhr.status,
              message: body.message || xhr.statusText || "Request failed",
              ...body,
            }),
          );
          return;
        }
        finish(() => resolve(body.data !== undefined && body.code !== undefined ? body.data : body));
      };

      xhr.upload.onprogress = (e) => {
        if (!progressCallback || !e.lengthComputable) return;
        progressCallback(Math.min((e.loaded / e.total) * 100, 100));
      };

      xhr.onabort = () => finish(() => reject(abortError()));
      xhr.ontimeout = () => finish(() => reject({ code: 408, message: "Upload timeout" }));
      xhr.onerror = () => {
        if (signal?.aborted) {
          finish(() => reject(abortError()));
          return;
        }
        finish(() => reject({ code: 400, message: `Upload error: ${xhr.statusText}` }));
      };
      xhr.send(data);
    });

  return sendOnce().catch(async (err) => {
    if (isAbortError(err) || signal?.aborted) throw abortError();
    if (err?.code === 401 && (await trySilentRefresh())) return sendOnce();
    throw err;
  });
}

function asIndexList(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter((n) => Number.isInteger(n));
  return [];
}

class Uploader {
  private fileApiBase = resolveFileApiBase();
  private chunkUrl = `${this.fileApiBase}/file/upload/chunk`;
  private smallUrl = `${this.fileApiBase}/file/upload`;
  private initUrl = "/file/upload/init";
  private statusUrl = "/file/upload/status";
  private mergeUrl = "/file/upload/complete";
  private headers: Record<string, string> = {};
  private chunkSize = DEFAULT_CHUNK_SIZE;
  private maxConcurrents = DEFAULT_MAX_CONCURRENTS;
  private hashCache = new WeakMap<File, { metas: FileChunkMeta[]; fileHash: string; chunkSize: number }>();

  create(url: string, config: { headers?: Record<string, string> } = {}) {
    this.chunkUrl = url || this.chunkUrl;
    this.headers = config.headers || {};
    let progressCallback: ProgressCallback = () => {};
    return {
      upload: (file: File, signal?: AbortSignal) => this.uploadBySize(file, () => {}, signal),
      uploadSmall: (file: File, signal?: AbortSignal) => this.uploadSmallFile(file, () => {}, signal),
      onProgress: (callback: ProgressCallback) => {
        progressCallback = callback;
        return progressCallback;
      },
    };
  }

  async uploadBySize(
    file: File,
    onProgress: UploadProgressCallback = () => {},
    signal?: AbortSignal,
    allowedTypes?: string[],
  ): Promise<LargeUploadResult> {
    if (file.size <= SMALL_FILE_SIZE) {
      onProgress(0, "uploading", "uploading");
      const res = await this.uploadSmallFile(
        file,
        (p) => onProgress(p, "uploading", "uploading"),
        signal,
        allowedTypes,
      );
      onProgress(100, "success", "success");
      return res;
    }
    return this.uploadChunked(file, onProgress, signal, allowedTypes);
  }

  private uploadSmallFile(
    file: File,
    progressCallback: ProgressCallback,
    signal?: AbortSignal,
    allowedTypes?: string[],
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    if (allowedTypes?.length) {
      formData.append("allowedTypes", JSON.stringify(allowedTypes));
    }
    return xhrUpload({
      url: this.smallUrl,
      data: formData,
      headers: this.headers,
      progressCallback,
      signal,
    });
  }

  private async uploadChunked(
    file: File,
    onProgress: UploadProgressCallback,
    signal?: AbortSignal,
    allowedTypes?: string[],
  ): Promise<LargeUploadResult> {
    onProgress(1, "uploading", "hashing");
    let cached = this.hashCache.get(file);
    if (!cached || cached.chunkSize !== this.chunkSize) {
      const metas = await hashChunksWithWorker(
        file,
        this.chunkSize,
        (done, total) => {
          onProgress(Math.round((done / total) * 8), "uploading", "hashing");
        },
        signal,
      );
      cached = {
        metas,
        fileHash: calculateTotalHashWithChunks(metas.map((m) => m.hash)),
        chunkSize: this.chunkSize,
      };
      this.hashCache.set(file, cached);
    }
    const { fileHash } = cached;
    if (signal?.aborted) throw abortError();

    const inited: any = await request.post({
      url: this.initUrl,
      data: {
        name: file.name,
        size: file.size,
        hash: fileHash,
        mime: file.type,
        hashType: "chunk_large",
        ...(allowedTypes?.length ? { allowedTypes } : {}),
      },
      otherConfig: { timeout: 120000, signal },
    });
    if (inited?.fileId && inited?.url && !inited?.uploadId) {
      onProgress(100, "success", "success");
      return {
        id: inited.fileId,
        url: inited.url,
        name: inited.name || file.name,
        type: inited.type,
        size: inited.size ?? file.size,
      };
    }

    const chunkSize = Number(inited.chunkSize) || this.chunkSize;
    const totalChunks = Number(inited.totalChunks) || this.hashCache.get(file)?.metas.length || 0;
    const uploadId = inited.uploadId as string;
    if (chunkSize !== cached.chunkSize) {
      onProgress(1, "uploading", "hashing");
      const nextMetas = await hashChunksWithWorker(
        file,
        chunkSize,
        (done, total) => {
          onProgress(Math.round((done / total) * 8), "uploading", "hashing");
        },
        signal,
      );
      cached = {
        metas: nextMetas,
        fileHash: calculateTotalHashWithChunks(nextMetas.map((m) => m.hash)),
        chunkSize,
      };
      this.hashCache.set(file, cached);
    }
    const workingMetas = this.hashCache.get(file)!.metas;
    const workingHash = this.hashCache.get(file)!.fileHash;
    const workingMetaByIndex = new Map(workingMetas.map((m) => [m.index, m]));

    let missing = asIndexList(inited.missingIndexes);
    if (!missing.length) {
      const uploaded = asIndexList(inited.uploadedIndexes);
      missing = [];
      for (let i = 0; i < totalChunks; i++) {
        if (!uploaded.includes(i)) missing.push(i);
      }
    }
    if (!missing.length) {
      const status = await this.fetchStatus(workingHash, uploadId);
      missing = status.missingIndexes;
      if (!missing.length && status.uploadedIndexes.length < totalChunks) {
        for (let i = 0; i < totalChunks; i++) {
          if (!status.uploadedIndexes.includes(i)) missing.push(i);
        }
      }
    }

    let finished = totalChunks - missing.length;
    const bump = () => {
      const percent = 8 + Math.round((finished / Math.max(totalChunks, 1)) * 84);
      onProgress(Math.min(percent, 92), "uploading", "uploading");
    };
    bump();

    const sendMissing = async (indexes: number[]) => {
      await this.uploadIndexes(
        file,
        indexes,
        workingMetaByIndex,
        {
          fileName: file.name,
          fileHash: workingHash,
          totalChunks,
          chunkSize,
          uploadId,
        },
        signal,
        () => {
          finished += 1;
          bump();
        },
      );
    };

    const requestMerge = () =>
      request.post({
        url: this.mergeUrl,
        data: {
          uploadId,
          fileName: file.name,
          fileHash: workingHash,
          hashType: "chunk_large",
        },
        otherConfig: { timeout: 600000, signal },
      });

    let guard = 0;
    while (guard < 8) {
      guard += 1;
      if (signal?.aborted) throw abortError();
      if (missing.length) await sendMissing(missing);
      if (signal?.aborted) throw abortError();

      const status = await this.fetchStatus(workingHash, uploadId);
      missing = asIndexList(status.missingIndexes);
      if (!missing.length && status.uploadedIndexes.length < totalChunks) {
        for (let i = 0; i < totalChunks; i++) {
          if (!status.uploadedIndexes.includes(i)) missing.push(i);
        }
      }
      finished = totalChunks - missing.length;
      bump();
      if (missing.length) continue;

      onProgress(94, "uploading", "merging");
      const merged: any = await requestMerge();
      if (!merged?.incomplete) {
        onProgress(100, "success", "success");
        return merged;
      }
      missing = asIndexList(merged.missingIndexes);
      finished = totalChunks - missing.length;
      bump();
    }
    onProgress(0, "error", "error");
    throw new Error("仍有分片缺失，请继续上传");
  }

  private async fetchStatus(hash: string, uploadId?: string) {
    try {
      const res: any = await request.post({
        url: this.statusUrl,
        data: { hash, uploadId },
        otherConfig: { timeout: 60000 },
      });
      const uploaded = asIndexList(res?.uploadedIndexes ?? res);
      const missing = asIndexList(res?.missingIndexes);
      return { uploadedIndexes: uploaded, missingIndexes: missing };
    } catch {
      return { uploadedIndexes: [], missingIndexes: [] };
    }
  }

  private async uploadIndexes(
    file: File,
    indexes: number[],
    metaByIndex: Map<number, FileChunkMeta>,
    ctx: {
      fileName: string;
      fileHash: string;
      totalChunks: number;
      chunkSize: number;
      uploadId: string;
    },
    signal: AbortSignal | undefined,
    onChunkDone: () => void,
  ) {
    const ordered = [...indexes].sort((a, b) => a - b);
    if (!ordered.length) return;
    const errors: unknown[] = [];
    let cursor = 0;
    const workerCount = Math.min(this.maxConcurrents, ordered.length);

    const runWorker = async () => {
      while (cursor < ordered.length) {
        if (signal?.aborted) throw abortError();
        const index = ordered[cursor];
        cursor += 1;
        try {
          await this.uploadOne(file, index, metaByIndex, ctx, signal);
          if (signal?.aborted) throw abortError();
          onChunkDone();
        } catch (error) {
          if (isAbortError(error) || signal?.aborted) throw abortError();
          errors.push(error);
        }
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    if (signal?.aborted) throw abortError();
    if (errors.length) throw new AggregateError(errors, "Some chunks failed to upload");
  }

  private async uploadOne(
    file: File,
    index: number,
    metaByIndex: Map<number, FileChunkMeta>,
    ctx: {
      fileName: string;
      fileHash: string;
      totalChunks: number;
      chunkSize: number;
      uploadId: string;
    },
    signal: AbortSignal | undefined,
    retries = 3,
  ): Promise<void> {
    const meta = metaByIndex.get(index);
    if (!meta) throw new Error(`missing chunk meta ${index}`);
    if (signal?.aborted) throw abortError();
    try {
      const formData = new FormData();
      formData.append("chunk", sliceChunk(file, index, ctx.chunkSize));
      formData.append("chunkName", `${index}-${ctx.fileName}`);
      formData.append("chunkHash", meta.hash);
      formData.append("chunkIndex", String(index));
      formData.append("totalChunks", String(ctx.totalChunks));
      formData.append("fileName", ctx.fileName);
      formData.append("fileHash", ctx.fileHash);
      formData.append("hashType", "chunk_large");
      formData.append("uploadId", ctx.uploadId);
      await xhrUpload({
        url: this.chunkUrl,
        data: formData,
        headers: this.headers,
        signal,
      });
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw abortError();
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 400 * (4 - retries)));
        return this.uploadOne(file, index, metaByIndex, ctx, signal, retries - 1);
      }
      throw error;
    }
  }
}

const Upload = new Uploader();

export async function uploadBySize(
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal,
  allowedTypes?: string[],
): Promise<LargeUploadResult> {
  onProgress?.(0, "uploading", "hashing");
  try {
    const res = await Upload.uploadBySize(file, onProgress || (() => undefined), signal, allowedTypes);
    const url = typeof res === "string" ? (res as unknown as string) : res?.url;
    if (!url && !(res as LargeUploadResult)?.id) {
      onProgress?.(0, "error", "error");
      throw new Error("Upload failed");
    }
    onProgress?.(100, "success", "success");
    return typeof res === "string" ? { url: res } : res;
  } catch (error) {
    if (!isAbortError(error)) onProgress?.(0, "error", "error");
    throw error;
  }
}

export default Upload;
