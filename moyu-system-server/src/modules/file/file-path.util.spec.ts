import { contentAddressPath, sanitizeTenantSegment } from './file-path.util';

describe('contentAddressPath', () => {
  it('prefixes tenant and stores by hash', () => {
    expect(contentAddressPath('abcdef1234', 'mp4', '1')).toBe(
      '1/files/ab/abcdef1234.mp4',
    );
    expect(contentAddressPath('ABCDEF1234', '.MP4', 'acme')).toBe(
      'acme/files/ab/abcdef1234.mp4',
    );
  });

  it('sanitizes tenant segment', () => {
    expect(sanitizeTenantSegment('../etc')).toBe('etc');
    expect(contentAddressPath('aa', 'bin', '../x')).toBe('x/files/aa/aa.bin');
  });
});
