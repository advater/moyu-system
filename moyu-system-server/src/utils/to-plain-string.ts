/**
 * Convert unknown values to a string without falling back to "[object Object]".
 * Objects, functions and symbols return the fallback (default empty string).
 */
export function toPlainString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return Number.isFinite(value) ? String(value) : fallback;
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return fallback;
  }
}

/**
 * First value that can be rendered as a plain string.
 * Skips null/undefined and non-plain values (objects, etc.).
 */
export function firstPlainString(...values: unknown[]): string {
  for (const value of values) {
    if (value == null) continue;
    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      return toPlainString(value);
    }
  }
  return '';
}