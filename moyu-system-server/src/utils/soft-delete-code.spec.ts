import { freeUniqueCode } from './soft-delete-code';

describe('freeUniqueCode', () => {
  it('追加 __del__{id}', () => {
    expect(freeUniqueCode('admin', 12)).toBe('admin__del__12');
  });

  it('超长时截断前缀', () => {
    const code = 'a'.repeat(60);
    const out = freeUniqueCode(code, 99, 64);
    expect(out.length).toBeLessThanOrEqual(64);
    expect(out.endsWith('__del__99')).toBe(true);
  });
});
