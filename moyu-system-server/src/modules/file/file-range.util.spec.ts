import { parseRangeHeader } from './file-range.util';

describe('parseRangeHeader', () => {
  it('returns full range when header missing', () => {
    expect(parseRangeHeader(undefined, 100)).toEqual({
      range: { start: 0, end: 99 },
      partial: false,
    });
  });

  it('parses bytes start-end', () => {
    expect(parseRangeHeader('bytes=0-0', 100)).toEqual({
      range: { start: 0, end: 0 },
      partial: true,
    });
    expect(parseRangeHeader('bytes=10-19', 100)).toEqual({
      range: { start: 10, end: 19 },
      partial: true,
    });
  });

  it('parses open-ended and suffix ranges', () => {
    expect(parseRangeHeader('bytes=90-', 100)?.range).toEqual({
      start: 90,
      end: 99,
    });
    expect(parseRangeHeader('bytes=-10', 100)?.range).toEqual({
      start: 90,
      end: 99,
    });
  });

  it('rejects invalid ranges', () => {
    expect(parseRangeHeader('items=0-1', 100)).toBeNull();
    expect(parseRangeHeader('bytes=20-10', 100)).toBeNull();
    expect(parseRangeHeader('bytes=100-101', 100)).toBeNull();
  });
});
