import {
  fileExtension,
  matchesAllowedTypes,
  matchesMagic,
  mimeFromExt,
  parseAllowedTypes,
  parseDataUrlBase64,
} from './file-validate';

describe('file-validate', () => {
  it('normalizes extensions without a whitelist', () => {
    expect(fileExtension('a.png')).toBe('png');
    expect(fileExtension('x.exe')).toBe('exe');
    expect(fileExtension('noext')).toBe('bin');
    expect(mimeFromExt('png')).toBe('image/png');
  });

  it('checks jpeg magic', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    expect(matchesMagic(buf, 'image/jpeg')).toBe(true);
    expect(matchesMagic(Buffer.from([0x00, 0x01]), 'image/jpeg')).toBe(false);
  });

  it('parses data URL base64', () => {
    const parsed = parseDataUrlBase64(
      'data:image/png;base64,aGVsbG8=',
    );
    expect(parsed.mime).toBe('image/png');
    expect(parsed.buffer.toString()).toBe('hello');
  });

  it('allows all types when allowedTypes is omitted or empty', () => {
    expect(matchesAllowedTypes('a.mp4', 'video/mp4')).toBe(true);
    expect(matchesAllowedTypes('a.mp4', 'video/mp4', [])).toBe(true);
    expect(matchesAllowedTypes('a.exe', 'application/octet-stream', undefined)).toBe(true);
  });

  it('restricts only when allowedTypes is provided', () => {
    expect(matchesAllowedTypes('a.mp4', 'video/mp4', ['video/*'])).toBe(true);
    expect(matchesAllowedTypes('a.mp4', 'video/mp4', ['video/mp4'])).toBe(true);
    expect(matchesAllowedTypes('a.mp4', 'video/mp4', ['.mp4'])).toBe(true);
    expect(matchesAllowedTypes('a.mp4', 'video/mp4', ['image/png'])).toBe(false);
    expect(parseAllowedTypes(undefined)).toBeUndefined();
    expect(parseAllowedTypes('')).toBeUndefined();
    expect(parseAllowedTypes([])).toBeUndefined();
    expect(parseAllowedTypes('video/mp4,image/png')).toEqual(['video/mp4', 'image/png']);
    expect(parseAllowedTypes('[object Object]')).toBeUndefined();
  });
});
