/** 路径段：禁止穿越 */
export function sanitizeTenantSegment(tenantId: string): string {
  const s = String(tenantId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);
  return s || 'unknown';
}

/** 内容寻址路径：租户前缀 + hash，同租户同指纹共用一份 */
export function contentAddressPath(
  hash: string,
  ext?: string,
  tenantId?: string,
): string {
  const h = String(hash || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const name = h || 'unknown';
  const prefix = name.slice(0, 2).padEnd(2, '0');
  const safeExt = String(ext || '')
    .toLowerCase()
    .replace(/^\./, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  const tenant = sanitizeTenantSegment(tenantId || '');
  const leaf = safeExt ? `${name}.${safeExt}` : name;
  return `${tenant}/files/${prefix}/${leaf}`;
}
