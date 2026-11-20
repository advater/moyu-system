import type { ByteRange } from './file-storage.interface';

export function parseRangeHeader(
  rangeHeader: string | undefined,
  size: number,
): { range: ByteRange; partial: boolean } | null {
  if (size <= 0) {
    return { range: { start: 0, end: 0 }, partial: false };
  }
  if (!rangeHeader) {
    return { range: { start: 0, end: size - 1 }, partial: false };
  }
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;
  const startRaw = match[1];
  const endRaw = match[2];
  let start: number;
  let end: number;
  if (startRaw === '' && endRaw !== '') {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = startRaw === '' ? 0 : Number(startRaw);
    end = endRaw === '' ? size - 1 : Number(endRaw);
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
    return null;
  }
  if (start >= size) return null;
  end = Math.min(end, size - 1);
  return {
    range: { start, end },
    partial: start !== 0 || end !== size - 1,
  };
}

export function contentDisposition(
  kind: 'inline' | 'attachment',
  fileName: string,
): string {
  return `${kind}; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
