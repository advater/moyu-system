import { toIntArray, toPositiveInt } from './to-positive-int';

describe('toPositiveInt', () => {
  it('keeps a valid number', () => {
    expect(toPositiveInt(10, 10)).toBe(10);
  });

  it('coerces numeric strings used by query params', () => {
    expect(toPositiveInt('10', 10)).toBe(10);
  });

  it('falls back on empty / invalid / zero', () => {
    expect(toPositiveInt('', 10)).toBe(10);
    expect(toPositiveInt('abc', 10)).toBe(10);
    expect(toPositiveInt(0, 10)).toBe(10);
    expect(toPositiveInt(-1, 10)).toBe(10);
    expect(toPositiveInt(undefined, 7)).toBe(7);
  });

  it('caps at max', () => {
    expect(toPositiveInt(999, 10, 50)).toBe(50);
  });
});

describe('toIntArray', () => {
  it('parses a single query string id', () => {
    expect(toIntArray('1')).toEqual([1]);
  });

  it('parses comma-separated and array query values', () => {
    expect(toIntArray('1,2')).toEqual([1, 2]);
    expect(toIntArray(['1', '3'])).toEqual([1, 3]);
    expect(toIntArray([4, 5])).toEqual([4, 5]);
  });

  it('drops empty / invalid', () => {
    expect(toIntArray('')).toEqual([]);
    expect(toIntArray('a,0,-2')).toEqual([]);
  });
});
