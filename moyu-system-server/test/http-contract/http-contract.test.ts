import 'reflect-metadata';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthError, DeptError, PermissionError, TenantError } from '@/config/error-messages';
import { createHttpContractApp } from './create-app';
import { HttpContractTokenService } from './fakes';
import {
  DEPT,
  TENANT_B,
  USER,
  httpContractWorld,
} from './world';

type JsonBody = {
  code?: number;
  data?: unknown;
  message?: string;
  errorCode?: string;
};

async function inject(
  app: NestFastifyApplication,
  opts: {
    method: 'GET' | 'PUT' | 'DELETE' | 'POST';
    url: string;
    token?: string;
    tenantId?: string;
    body?: unknown;
  },
) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.tenantId) headers['tenant-id'] = opts.tenantId;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const res = await app.inject({
    method: opts.method,
    url: opts.url,
    headers,
    payload: opts.body as never,
  });
  let json: JsonBody = {};
  try {
    json = res.json() as JsonBody;
  } catch {
    json = {};
  }
  return { status: res.statusCode, json };
}

describe('HTTP contract (guards + tenant + dataScope)', { timeout: 120000 }, () => {
  let app: NestFastifyApplication;
  let tokens: HttpContractTokenService;

  before(async () => {
    app = await createHttpContractApp();
    tokens = app.get(HttpContractTokenService);
  });

  after(async () => {
    await app.close();
  });

  beforeEach(() => {
    httpContractWorld.reset();
  });

  it('无令牌访问受保护接口 → 401', async () => {
    const res = await inject(app, { method: 'GET', url: '/user/page' });
    assert.equal(res.status, 401);
    assert.equal(res.json.errorCode, AuthError.INVALID_TOKEN);
  });

  it('有令牌但无权限码 → 403；超管旁路', async () => {
    const staff = tokens.issue(USER.TENANT_A_SELF);
    const denied = await inject(app, {
      method: 'DELETE',
      url: '/dept/delete',
      token: staff.accessToken,
      body: { id: DEPT.A_EMPTY },
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.json.errorCode, PermissionError.INSUFFICIENT_PERMISSIONS);

    const superTok = tokens.issue(USER.SUPER_ADMIN);
    const allowed = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: superTok.accessToken,
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.json.code, 200);
  });

  it('租户 A 不能读写租户 B', async () => {
    const a = tokens.issue(USER.TENANT_A_ADMIN);
    const page = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: a.accessToken,
    });
    assert.equal(page.status, 200);
    const ids = ((page.json.data as { list: { id: number }[] }).list).map(
      (u) => u.id,
    );
    assert.equal(ids.includes(USER.TENANT_B_ADMIN), false);
    assert.equal(ids.includes(USER.TENANT_A_ADMIN), true);

    const getB = await inject(app, {
      method: 'GET',
      url: `/user/get?id=${USER.TENANT_B_ADMIN}`,
      token: a.accessToken,
    });
    assert.equal(getB.status, 404);

    const switchTenant = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: a.accessToken,
      tenantId: TENANT_B,
    });
    assert.equal(switchTenant.status, 403);
    assert.equal(switchTenant.json.errorCode, TenantError.USER_NOT_BELONG);
  });

  it('dataScope 列表仅本人；单条越权 → 403', async () => {
    const self = tokens.issue(USER.TENANT_A_SELF);
    const page = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: self.accessToken,
    });
    assert.equal(page.status, 200);
    const list = (page.json.data as { list: { id: number }[] }).list;
    assert.deepEqual(
      list.map((u) => u.id),
      [USER.TENANT_A_SELF],
    );

    const peer = await inject(app, {
      method: 'GET',
      url: `/user/get?id=${USER.TENANT_A_ADMIN}`,
      token: self.accessToken,
    });
    assert.equal(peer.status, 403);
    assert.equal(peer.json.errorCode, PermissionError.INSUFFICIENT_PERMISSIONS);
  });

  it('强制下线后旧 token 立即失效', async () => {
    const victim = tokens.issue(USER.TENANT_A_SELF);
    const admin = tokens.issue(USER.TENANT_A_ADMIN);
    const logout = await inject(app, {
      method: 'PUT',
      url: '/oauth2-token/force-logout',
      token: admin.accessToken,
      body: { userId: USER.TENANT_A_SELF },
    });
    assert.equal(logout.status, 200);
    assert.equal((logout.json.data as { revoked: number }).revoked, 1);

    const after = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: victim.accessToken,
    });
    assert.equal(after.status, 401);
    assert.equal(after.json.errorCode, AuthError.INVALID_TOKEN);
  });

  it('删部门：子部门 / 下属用户 / 角色引用时拒绝', async () => {
    const admin = tokens.issue(USER.TENANT_A_ADMIN);
    const children = await inject(app, {
      method: 'DELETE',
      url: '/dept/delete',
      token: admin.accessToken,
      body: { id: DEPT.A_ROOT },
    });
    assert.equal(children.status, 400);
    assert.equal(children.json.errorCode, DeptError.HAS_CHILDREN);

    const users = await inject(app, {
      method: 'DELETE',
      url: '/dept/delete',
      token: admin.accessToken,
      body: { id: DEPT.A_CHILD },
    });
    assert.equal(users.status, 400);
    assert.equal(users.json.errorCode, DeptError.HAS_USERS);

    const scoped = await inject(app, {
      method: 'DELETE',
      url: '/dept/delete',
      token: admin.accessToken,
      body: { id: DEPT.A_SCOPED },
    });
    assert.equal(scoped.status, 400);
    assert.equal(scoped.json.errorCode, DeptError.IN_DATA_SCOPE);

    const ok = await inject(app, {
      method: 'DELETE',
      url: '/dept/delete',
      token: admin.accessToken,
      body: { id: DEPT.A_EMPTY },
    });
    assert.equal(ok.status, 200);
  });

  it('超会话数淘汰旧 token；强制改密仅放行白名单', async () => {
    httpContractWorld.maxSessions = 2;
    const t1 = tokens.issue(USER.TENANT_A_ADMIN, new Date(1));
    const t2 = tokens.issue(USER.TENANT_A_ADMIN, new Date(2));
    const t3 = tokens.issue(USER.TENANT_A_ADMIN, new Date(3));

    const old = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: t1.accessToken,
    });
    assert.equal(old.status, 401);

    const keep = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: t3.accessToken,
    });
    assert.equal(keep.status, 200);
    assert.ok(await tokens.findAccessToken(t2.accessToken));

    const mcp = tokens.issue(USER.MUST_CHANGE);
    const blocked = await inject(app, {
      method: 'GET',
      url: '/user/page',
      token: mcp.accessToken,
    });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.errorCode, AuthError.MUST_CHANGE_PASSWORD);

    const allowed = await inject(app, {
      method: 'GET',
      url: '/user-profile/get',
      token: mcp.accessToken,
    });
    assert.equal(allowed.status, 200);
  });
});
