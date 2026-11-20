/**
 * 软删时改写唯一业务码，释放 (tenantId, code) 等唯一约束，便于同码重建。
 * 格式：`{原码截断}__del__{id}`，总长不超过 maxLen。
 */
export function freeUniqueCode(
  code: string,
  id: number,
  maxLen = 64,
): string {
  const suffix = `__del__${id}`;
  const keep = Math.max(1, maxLen - suffix.length);
  return `${String(code).slice(0, keep)}${suffix}`.slice(0, maxLen);
}
