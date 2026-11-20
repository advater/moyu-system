import { HttpException, HttpStatus } from '@nestjs/common';
import { CommonError } from '@/config/error-messages';

/** 从 Body 优先、Query 兜底解析单个 id */
export function resolveId(
  bodyId: unknown,
  queryId: unknown,
  emptyMessage = CommonError.ID_REQUIRED,
): number {
  const raw = bodyId !== undefined && bodyId !== null && bodyId !== ''
    ? bodyId
    : queryId;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpException(emptyMessage, HttpStatus.BAD_REQUEST);
  }
  return id;
}

/** 从 Body 优先、Query 兜底解析 ids 数组 */
export function resolveIds(
  bodyIds: unknown,
  queryIds: unknown,
  emptyMessage = CommonError.IDS_REQUIRED,
): number[] {
  const raw =
    bodyIds !== undefined && bodyIds !== null ? bodyIds : queryIds;
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (raw !== undefined && raw !== null && raw !== '') {
    list = [raw];
  }
  const ids = list
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) {
    throw new HttpException(emptyMessage, HttpStatus.BAD_REQUEST);
  }
  return ids;
}
