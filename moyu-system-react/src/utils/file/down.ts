/**
 * 浏览器下载：小文件内存流；大文件 HTTP Range 从断点续拉（游戏更新同款）。
 * 进度按已收字节计算。落盘优先 File System Access（边下边写），否则 IndexedDB 增量拼接后再另存。
 * 不做多路分片再合并：浏览器里 Range 续传就是顺序增量，少一次拼装和乱序洞。
 */
import Token from "@/utils/token";
import { getTenantId } from "@/utils/auth";

interface MsNavigator extends globalThis.Navigator {
  msSaveBlob?: (blob: Blob, fileName: string) => void;
}

export type DownloadProgress = (percent: number, received: number, total: number) => void;

export function downloadExcel(blob: Blob, fileName: string) {
  downloadBlob(fileName, blob);
}

export function downloadBlob(fileName: string, blob: Blob) {
  if ("download" in document.createElement("a")) {
    const elink = document.createElement("a");
    elink.download = fileName;
    elink.style.display = "none";
    elink.href = URL.createObjectURL(blob);
    document.body.appendChild(elink);
    elink.click();
    URL.revokeObjectURL(elink.href);
    document.body.removeChild(elink);
    return;
  }
  (navigator as MsNavigator).msSaveBlob?.(blob, fileName);
}

export function formatBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 10 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    domainName: window.location.host,
    ...(extra || {}),
  };
  const token = Token.getToken();
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const tenantId = getTenantId();
  if (tenantId && !headers["tenant-id"]) headers["tenant-id"] = tenantId;
  return headers;
}

const IDB_NAME = "moyu-file-dl";
const IDB_STORE = "parts";
const IDB_VER = 2;
const FLUSH_BYTES = 2 * 1024 * 1024;
const DIRECT_SAVE_BYTES = 50 * 1024 * 1024;

type FsWritable = {
  write: (data: BufferSource | Blob) => Promise<void>;
  seek: (pos: number) => Promise<void>;
  close: () => Promise<void>;
};

type FsHandle = {
  getFile: () => Promise<File>;
  createWritable: (opts?: { keepExistingData?: boolean }) => Promise<FsWritable>;
};

type StoredDownload = {
  id: number;
  name: string;
  type: string;
  total: number;
  received: number;
  blob?: Blob;
  handle?: FsHandle;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VER);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(id: number): Promise<StoredDownload | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredDownload | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(row: StoredDownload): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(row, row.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function downloadStream(
  url: string,
  config: {
    onProgress: (percent: number) => void;
    onSuccess: (data: Uint8Array) => void;
    onCancel?: () => void;
    headers?: Record<string, string>;
  },
): Promise<Uint8Array> {
  const controller = new AbortController();
  if (config.onCancel) {
    const prev = config.onCancel;
    config.onCancel = () => {
      controller.abort();
      prev();
    };
  }
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    signal: controller.signal,
    headers: authHeaders(config.headers),
  });
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  const length = response.headers.get("Content-Length");
  const totalSize = parseInt(length || "0", 10);
  let downloadedSize = 0;
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    downloadedSize += value.length;
    chunks.push(value);
    if (totalSize > 0) config.onProgress((downloadedSize / totalSize) * 100);
  }
  const chunksAll = new Uint8Array(downloadedSize);
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }
  config.onSuccess(chunksAll);
  return chunksAll;
}

async function pickSaveHandle(fileName: string): Promise<FsHandle | undefined> {
  const picker = (window as Window & { showSaveFilePicker?: (opts: unknown) => Promise<FsHandle> })
    .showSaveFilePicker;
  if (typeof picker !== "function") return undefined;
  try {
    return await picker({
      suggestedName: fileName,
      excludeAcceptAllOption: false,
    });
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return undefined;
    throw err;
  }
}

/**
 * Range 从 offset 拉到 EOF，进度回调；暂停后本地保留已收字节。
 */
export async function downloadResumable(opts: {
  url: string;
  fileId: number;
  fileName: string;
  mime?: string;
  expectedSize?: number;
  signal?: AbortSignal;
  onProgress?: DownloadProgress;
}): Promise<Blob | null> {
  let prev = await idbGet(opts.fileId);
  if (prev && (prev.name !== opts.fileName || (opts.expectedSize && prev.total && prev.total !== opts.expectedSize))) {
    await idbDel(opts.fileId);
    prev = undefined;
  }

  let handle = prev?.handle;
  let received = prev?.received ?? 0;
  let stored = prev?.blob;
  let total = prev?.total || opts.expectedSize || 0;

  if (handle) {
    try {
      const file = await handle.getFile();
      received = file.size;
    } catch {
      handle = undefined;
      received = 0;
    }
  }

  if (total > 0 && received >= total) {
    if (handle) {
      await idbDel(opts.fileId);
      opts.onProgress?.(100, total, total);
      return null;
    }
    if (stored) {
      await idbDel(opts.fileId);
      opts.onProgress?.(100, stored.size, stored.size);
      return stored;
    }
  }

  if (!handle && !stored && (opts.expectedSize || 0) >= DIRECT_SAVE_BYTES) {
    handle = await pickSaveHandle(opts.fileName);
  }

  let flushedAt = received;
  const persistMeta = async () => {
    await idbSet({
      id: opts.fileId,
      name: opts.fileName,
      type: opts.mime || "application/octet-stream",
      total,
      received,
      blob: handle ? undefined : stored,
      handle,
    });
    flushedAt = received;
  };

  let writable: FsWritable | undefined;
  if (handle) {
    writable = await handle.createWritable({ keepExistingData: true });
    await writable.seek(received);
    await persistMeta();
  }

  const bump = () => {
    if (total > 0) opts.onProgress?.(Math.min((received / total) * 100, 99.9), received, total);
  };

  let pending: Blob[] = [];
  let pendingBytes = 0;
  const flushMemory = async (force = false) => {
    if (handle || !pending.length) return;
    if (!force && pendingBytes < FLUSH_BYTES) return;
    stored = stored ? new Blob([stored, ...pending]) : new Blob(pending);
    pending = [];
    pendingBytes = 0;
    await persistMeta();
  };

  const append = async (chunk: Uint8Array) => {
    const bytes = new Uint8Array(chunk.byteLength);
    bytes.set(chunk);
    received += bytes.byteLength;
    if (writable) {
      await writable.write(bytes);
      if (received - flushedAt >= FLUSH_BYTES) await persistMeta();
    } else {
      pending.push(new Blob([bytes]));
      pendingBytes += chunk.byteLength;
      await flushMemory(false);
    }
    bump();
  };

  const closeWritable = async () => {
    if (!writable) return;
    try {
      await writable.close();
    } catch {
      /* ignore */
    }
    writable = undefined;
  };

  const pullOnce = async (from: number): Promise<"done" | "restart"> => {
    const headers = authHeaders();
    if (from > 0) headers.Range = `bytes=${from}-`;
    const response = await fetch(opts.url, {
      method: "GET",
      credentials: "include",
      signal: opts.signal,
      headers,
    });
    if (response.status === 416) {
      received = 0;
      stored = undefined;
      pending = [];
      pendingBytes = 0;
      if (writable) await writable.seek(0);
      return "restart";
    }
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    if (response.status === 200 && from > 0) {
      received = 0;
      stored = undefined;
      pending = [];
      pendingBytes = 0;
      if (writable) {
        await writable.seek(0);
      }
    }
    const contentRange = response.headers.get("Content-Range");
    const contentLength = Number(response.headers.get("Content-Length") || 0);
    const rangeMatch = contentRange?.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/i);
    if (rangeMatch && rangeMatch[3] !== "*") {
      total = Number(rangeMatch[3]);
      const start = Number(rangeMatch[1]);
      if (Number.isFinite(start) && start !== received && !handle) {
        received = start;
      }
    } else if (!total) {
      total = received + contentLength;
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("empty body");
    while (true) {
      if (opts.signal?.aborted) throw new DOMException("Download aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      await append(copy);
    }
    return "done";
  };

  try {
    let attempt = 0;
    while (attempt < 4) {
      if (opts.signal?.aborted) throw new DOMException("Download aborted", "AbortError");
      try {
        const result = await pullOnce(received);
        if (result === "restart") {
          received = 0;
          stored = undefined;
          attempt += 1;
          continue;
        }
        break;
      } catch (err) {
        if (opts.signal?.aborted || (err as DOMException)?.name === "AbortError") throw err;
        attempt += 1;
        if (attempt >= 4) throw err;
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
    await flushMemory(true);
    await persistMeta();
    await closeWritable();
  } catch (err) {
    const discard = opts.signal?.aborted && (opts.signal as AbortSignal & { reason?: unknown }).reason === "discard";
    if (discard) {
      await closeWritable();
      await idbDel(opts.fileId).catch(() => undefined);
      throw err;
    }
    await flushMemory(true).catch(() => undefined);
    await persistMeta().catch(() => undefined);
    await closeWritable();
    throw err;
  }

  opts.onProgress?.(100, received, total || received);
  if (handle) {
    await idbDel(opts.fileId);
    return null;
  }
  const blob =
    stored ||
    new Blob(pending, { type: opts.mime || "application/octet-stream" });
  await idbDel(opts.fileId);
  return blob;
}

export async function clearDownloadResume(fileId: number) {
  await idbDel(fileId);
}

const Down = {
  download: downloadBlob,
  downloadStream,
  downloadResumable,
};

export default Down;
