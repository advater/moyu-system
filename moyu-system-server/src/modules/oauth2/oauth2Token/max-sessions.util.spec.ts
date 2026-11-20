import { pickTokensToRevoke } from './max-sessions.util';

function tok(id: string, created: number) {
  return { accessToken: id, createTime: new Date(created) };
}

describe('pickTokensToRevoke', () => {
  it('max ≤ 0 不淘汰', () => {
    expect(pickTokensToRevoke([tok('a', 1), tok('b', 2)], 0, 'b')).toEqual([]);
    expect(pickTokensToRevoke([tok('a', 1)], -1, 'a')).toEqual([]);
  });

  it('未超上限不淘汰', () => {
    expect(
      pickTokensToRevoke([tok('a', 1), tok('b', 2)], 2, 'b'),
    ).toEqual([]);
  });

  it('超上限淘汰最旧且保留刚签发的', () => {
    const revoked = pickTokensToRevoke(
      [tok('old', 1), tok('mid', 2), tok('new', 3)],
      2,
      'new',
    );
    expect(revoked.map((t) => t.accessToken)).toEqual(['old']);
  });
});
