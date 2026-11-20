/**
 * 超出会话上限时选出应吊销的令牌（保留刚签发的 keepAccessToken）。
 * 按 createTime 升序淘汰最旧会话。max ≤ 0 表示不限制。
 */
export function pickTokensToRevoke<
  T extends { accessToken: string; createTime: Date },
>(active: T[], max: number, keepAccessToken: string): T[] {
  if (!Number.isFinite(max) || max <= 0) return [];
  if (active.length <= max) return [];
  const sorted = [...active].sort(
    (a, b) => a.createTime.getTime() - b.createTime.getTime(),
  );
  return sorted
    .filter((t) => t.accessToken !== keepAccessToken)
    .slice(0, Math.max(0, active.length - max));
}
