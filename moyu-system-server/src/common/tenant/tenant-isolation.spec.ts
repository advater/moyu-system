/**
 * 租户隔离断言（不依赖 Nest/Prisma 启动）
 * 全链路 DB 验证：启动服务后用两租户账号互查用户/字典即可。
 */
import {
  TENANT_SCOPED_MODELS,
  TenantContext,
} from './tenant.context';

describe('Tenant isolation contracts', () => {
  it('scopes org / messaging / oauth / config / file / api-log / error-code models', () => {
    for (const model of [
      'SysUser',
      'SysRole',
      'SysDictType',
      'SysConfig',
      'SysFile',
      'SysSmsLog',
      'SysMailLog',
      'SysOAuth2AccessToken',
      'SysLoginLog',
      'SysApiAccessLog',
      'SysApiErrorLog',
      'SysErrorCode',
      'SysNotice',
    ]) {
      expect(TENANT_SCOPED_MODELS.has(model)).toBe(true);
    }
    expect(TENANT_SCOPED_MODELS.has('SysMenu')).toBe(false);
    expect(TENANT_SCOPED_MODELS.has('SysTenant')).toBe(false);
    expect(TENANT_SCOPED_MODELS.has('SysJob')).toBe(false);
    expect(TENANT_SCOPED_MODELS.has('SysJobLog')).toBe(false);
  });

  it('ALS run isolates tenantId per async chain', async () => {
    const seen: string[] = [];
    await Promise.all([
      TenantContext.run({ tenantId: 't-a', ignore: false }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        seen.push(TenantContext.getTenantId() || '');
      }),
      TenantContext.run({ tenantId: 't-b', ignore: false }, async () => {
        await new Promise((r) => setTimeout(r, 1));
        seen.push(TenantContext.getTenantId() || '');
      }),
    ]);
    expect(seen.sort()).toEqual(['t-a', 't-b']);
  });

  it('ignore mode hides tenantId', () => {
    TenantContext.run({ tenantId: 'x', ignore: true }, () => {
      expect(TenantContext.getTenantId()).toBeNull();
      expect(TenantContext.isIgnored()).toBe(true);
    });
  });

  it('nested run restores outer tenant after inner completes', () => {
    TenantContext.run({ tenantId: 'outer', ignore: false }, () => {
      expect(TenantContext.getTenantId()).toBe('outer');
      TenantContext.run({ tenantId: 'inner', ignore: false }, () => {
        expect(TenantContext.getTenantId()).toBe('inner');
      });
      expect(TenantContext.getTenantId()).toBe('outer');
    });
  });
});
