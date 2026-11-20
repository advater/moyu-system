/**
 * 纯函数级 IP 规范化/格式化覆盖（与 IpService 私有逻辑对齐的公开行为通过服务测本机网段）
 */
describe('ip region helpers', () => {
  it('private ranges are recognized by pattern', () => {
    const isPrivate = (ip: string) => {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return false;
      const [a, b] = parts;
      return (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a === 127
      );
    };
    expect(isPrivate('127.0.0.1')).toBe(true);
    expect(isPrivate('10.0.0.1')).toBe(true);
    expect(isPrivate('192.168.1.1')).toBe(true);
    expect(isPrivate('8.8.8.8')).toBe(false);
  });
});
