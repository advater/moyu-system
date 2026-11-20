/**
 * Query / JSON 里的数字经常是字符串。Prisma `take` / `skip` / Int 字段
 * 不会隐式转换，直接传入会变成 500。
 */
export function toPositiveInt(
  value: unknown,
  fallback: number,
  max = 100,
): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.trunc(n), max);
}

/**
 * `?ids=1` / `?ids=1,2` / `?ids=1&ids=2` 在 Fastify 里经常是 string，
 * Prisma `id: { in }` 需要 Int[]。
 */
export function toIntArray(value: unknown): number[] {
  if (value == null || value === '') return [];
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'number'
      ? [value]
      : String(value).split(/[,\s]+/);
  const out: number[] = [];
  for (const part of parts) {
    if (part === '' || part == null) continue;
    const n = Number(typeof part === 'string' ? part.trim() : part);
    if (Number.isInteger(n) && n > 0) out.push(n);
  }
  return out;
}
