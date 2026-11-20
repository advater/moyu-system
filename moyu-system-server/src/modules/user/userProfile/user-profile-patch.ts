/**
 * 个人资料字段补丁语义：
 * - undefined：不改
 * - null / ""：清空为 null
 * - 其它：写入归一化后的值
 */
export function buildUserProfilePatch(
  req: {
    nickname?: string | null;
    email?: string | null;
    mobile?: string | null;
    sex?: number | null;
    avatar?: string | null;
  },
  presentKeys: ReadonlySet<string>,
): Record<string, string | number | null> {
  const data: Record<string, string | number | null> = {};

  const assignString = (key: 'nickname' | 'email' | 'mobile' | 'avatar') => {
    if (!presentKeys.has(key)) return;
    const raw = req[key];
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      data[key] = null;
      return;
    }
    data[key] = String(raw).trim();
  };

  assignString('nickname');
  assignString('email');
  assignString('mobile');
  assignString('avatar');

  if (presentKeys.has('sex')) {
    data.sex = req.sex === null || req.sex === undefined ? null : Number(req.sex);
  }

  return data;
}
