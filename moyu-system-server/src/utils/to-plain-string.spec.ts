import { firstPlainString, toPlainString } from './to-plain-string';

describe('toPlainString', () => {
  it('renders primitives and skips objects', () => {
    expect(toPlainString('ab')).toBe('ab');
    expect(toPlainString(12)).toBe('12');
    expect(toPlainString(false)).toBe('false');
    expect(toPlainString(Number.NaN)).toBe('');
    expect(toPlainString({ a: 1 })).toBe('');
    expect(toPlainString(null, 'x')).toBe('x');
  });
});

describe('firstPlainString', () => {
  it('takes the first plain value and skips objects', () => {
    expect(firstPlainString(undefined, { a: 1 }, 'ok', 'no')).toBe('ok');
    expect(firstPlainString(0)).toBe('0');
    expect(firstPlainString(undefined, null)).toBe('');
  });
});