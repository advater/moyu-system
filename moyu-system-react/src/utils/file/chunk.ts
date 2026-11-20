import SparkMD5 from "spark-md5";

export type FileChunkMeta = {
  index: number;
  hash: string;
  start: number;
  end: number;
};

/** 主线程按序号切片，上传时才 slice，避免 Worker 回传 Blob */
export function sliceChunk(file: File, index: number, chunkSize: number): Blob {
  const start = index * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  return file.slice(start, end);
}

export function chunkRange(index: number, chunkSize: number, fileSize: number) {
  const start = index * chunkSize;
  const end = Math.min(start + chunkSize, fileSize);
  return { start, end };
}

export function calculateTotalHashWithChunks(hashes: string[]) {
  const spark = new SparkMD5();
  spark.append(hashes.join(""));
  return spark.end();
}

/**
 * 主线程只切分任务区间，Web Worker 计算各片 MD5 后回传。
 */
export async function hashChunksWithWorker(
  file: File,
  chunkSize: number,
  onHashed?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<FileChunkMeta[]> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  if (totalChunks <= 0) return [];
  if (signal?.aborted) throw abortError();

  const fallback = () => hashChunksOnMain(file, chunkSize, onHashed, signal);
  if (typeof Worker === "undefined") return fallback();

  try {
    return await new Promise<FileChunkMeta[]>((resolve, reject) => {
      const threadCount = Math.min((navigator.hardwareConcurrency || 4) - 1, totalChunks) || 1;
      const threadChunkCount = Math.ceil(totalChunks / threadCount);
      const result: FileChunkMeta[] = new Array(totalChunks);
      let finishThreadCount = 0;
      let hashed = 0;
      let hasError = false;
      const workers: Worker[] = [];

      const stop = () => {
        hasError = true;
        workers.forEach((w) => w.terminate());
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        stop();
        reject(abortError());
      };
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener("abort", onAbort);

      for (let i = 0; i < threadCount; i++) {
        const worker = new Worker(new URL("./chunkHashWorker.ts", import.meta.url), {
          type: "module",
        });
        workers.push(worker);
        const start = i * threadChunkCount;
        const end = Math.min((i + 1) * threadChunkCount, totalChunks);
        worker.postMessage({ file, chunkSize, startChunkIndex: start, endChunkIndex: end });
        worker.onmessage = (e: MessageEvent<FileChunkMeta[]>) => {
          if (hasError) return;
          for (const item of e.data) {
            result[item.index] = item;
            hashed += 1;
            onHashed?.(hashed, totalChunks);
          }
          worker.terminate();
          finishThreadCount += 1;
          if (finishThreadCount === threadCount) {
            signal?.removeEventListener("abort", onAbort);
            resolve(result);
          }
        };
        worker.onerror = (error) => {
          stop();
          reject(error);
        };
      }
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    return fallback();
  }
}

export function abortError() {
  const err = new Error("Upload aborted") as Error & { code: number; name: string };
  err.code = 490;
  err.name = "AbortError";
  return err;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: number | string;
    name?: string;
    message?: string;
    errors?: unknown[];
    response?: { status?: number; data?: { code?: number } };
  };
  if (
    err.code === 490 ||
    err.code === "ERR_CANCELED" ||
    err.name === "AbortError" ||
    err.name === "CanceledError" ||
    err.message === "Upload aborted" ||
    err.message === "canceled" ||
    err.response?.status === 490 ||
    err.response?.data?.code === 490
  ) {
    return true;
  }
  if (Array.isArray(err.errors) && err.errors.length) {
    return err.errors.some(isAbortError);
  }
  return false;
}

async function hashChunksOnMain(
  file: File,
  chunkSize: number,
  onHashed?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<FileChunkMeta[]> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const metas: FileChunkMeta[] = [];
  for (let index = 0; index < totalChunks; index++) {
    if (signal?.aborted) throw abortError();
    const { start, end } = chunkRange(index, chunkSize, file.size);
    const hash = await hashBlob(file.slice(start, end));
    metas.push({ index, hash, start, end });
    onHashed?.(index + 1, totalChunks);
  }
  return metas;
}

function hashBlob(chunk: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      resolve(spark.end());
    };
    reader.onerror = () => reject(new Error("Failed to read chunk"));
    reader.readAsArrayBuffer(chunk);
  });
}
