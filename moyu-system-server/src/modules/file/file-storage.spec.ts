import { LocalFileStorage } from './local-file.storage';
import { OssFileStorage } from './oss-file.storage';

describe('file storage adapters', () => {
  it('local storage builds preview url', () => {
    const storage = new LocalFileStorage();
    expect(storage.kind).toBe('local');
    expect(storage.buildUrl(12, 'a/b.png')).toContain('system/file/preview?id=12');
    expect(typeof storage.saveStream).toBe('function');
    expect(typeof storage.createReadStream).toBe('function');
  });

  it('oss ctor throws without credentials', () => {
    const prev = process.env.FILE_STORAGE;
    delete process.env.OSS_ENDPOINT;
    delete process.env.OSS_BUCKET;
    delete process.env.OSS_ACCESS_KEY_ID;
    delete process.env.OSS_ACCESS_KEY_SECRET;
    expect(() => new OssFileStorage({})).toThrow(/OSS/);
    if (prev !== undefined) process.env.FILE_STORAGE = prev;
  });
});
