import { missingIndexes } from './file-chunk.util';

describe('missingIndexes', () => {
  it('returns gaps in order', () => {
    expect(missingIndexes(5, [0, 2, 4])).toEqual([1, 3]);
    expect(missingIndexes(3, [0, 1, 2])).toEqual([]);
    expect(missingIndexes(2, [])).toEqual([0, 1]);
  });
});
