import { md5JoinedChunkHashes, md5String } from './file-hash.util';

describe('file-hash.util', () => {
  it('joins chunk hashes the same way as SparkMD5 string append', () => {
    const hashes = ['abc', 'def'];
    expect(md5JoinedChunkHashes(hashes)).toBe(md5String('abcdef'));
  });
});
