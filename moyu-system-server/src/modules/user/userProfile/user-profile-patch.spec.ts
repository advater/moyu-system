import { buildUserProfilePatch } from './user-profile-patch';

describe('buildUserProfilePatch', () => {
  it('only patches present keys', () => {
    const patch = buildUserProfilePatch(
      { nickname: 'a', avatar: 'https://x/y.png' },
      new Set(['avatar']),
    );
    expect(patch).toEqual({ avatar: 'https://x/y.png' });
    expect(patch).not.toHaveProperty('nickname');
  });

  it('clears mobile with empty string or null', () => {
    expect(
      buildUserProfilePatch({ mobile: '' }, new Set(['mobile'])),
    ).toEqual({ mobile: null });
    expect(
      buildUserProfilePatch({ mobile: null }, new Set(['mobile'])),
    ).toEqual({ mobile: null });
  });

  it('does not overwrite omitted fields', () => {
    const patch = buildUserProfilePatch(
      { email: 'a@b.com', sex: 1 },
      new Set(['email']),
    );
    expect(patch).toEqual({ email: 'a@b.com' });
    expect(patch).not.toHaveProperty('sex');
  });

  it('trims string values', () => {
    expect(
      buildUserProfilePatch(
        { nickname: '  moyu  ' },
        new Set(['nickname']),
      ),
    ).toEqual({ nickname: 'moyu' });
  });
});
