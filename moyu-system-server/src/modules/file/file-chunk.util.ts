export function missingIndexes(total: number, uploaded: number[]): number[] {
  const set = new Set(uploaded);
  const missing: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!set.has(i)) missing.push(i);
  }
  return missing;
}
