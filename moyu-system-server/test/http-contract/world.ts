import {
  CommonStatusEnum,
  DataScopeEnum,
  SYSTEM_ADMIN_ROLE_CODE,
  TENANT_ADMIN_ROLE_CODE,
} from '@/config/constants';
import type { OAuth2AccessTokenDO } from '@/modules/oauth2/oauth2Token/entities/oauth2AccessToken.entity';
import type { RoleDO } from '@/modules/permission/role/entities/role.entity';

export const TENANT_A = '1';
export const TENANT_B = '2';

export const USER = {
  TENANT_A_ADMIN: 101,
  TENANT_A_SELF: 102,
  TENANT_A_PEER: 103,
  TENANT_B_ADMIN: 201,
  SUPER_ADMIN: 301,
  MUST_CHANGE: 401,
} as const;

export const DEPT = {
  A_ROOT: 10,
  A_CHILD: 11,
  A_SCOPED: 12,
  A_EMPTY: 13,
  B_ROOT: 20,
} as const;

export const ROLE = {
  TENANT_ADMIN: 1,
  STAFF: 2,
  SUPER: 3,
} as const;

export interface MemUser {
  id: number;
  tenantId: string;
  deptId: number | null;
  status: number;
  permVersion: number;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  roleIds: number[];
  username: string;
}

export interface MemDept {
  id: number;
  tenantId: string;
  name: string;
  parentId: number;
  sort: number;
  status: number;
  deleted: boolean;
  createTime: Date;
}

export interface MemToken extends OAuth2AccessTokenDO {
  deleted: boolean;
}

export interface MemRole {
  id: number;
  code: string;
  status: number;
  dataScope: number;
  dataScopeDeptIds: number[];
}

const QUERY_PERMS = ['system:user:query'];
const ADMIN_PERMS = [
  'system:user:query',
  'system:user:update',
  'system:dept:delete',
  'system:oauth2-token:delete',
];

function seedUsers(): MemUser[] {
  return [
    {
      id: USER.TENANT_A_ADMIN,
      tenantId: TENANT_A,
      deptId: DEPT.A_ROOT,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: false,
      roles: [TENANT_ADMIN_ROLE_CODE],
      permissions: ADMIN_PERMS,
      roleIds: [ROLE.TENANT_ADMIN],
      username: 'admin-a',
    },
    {
      id: USER.TENANT_A_SELF,
      tenantId: TENANT_A,
      deptId: DEPT.A_CHILD,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: false,
      roles: ['staff'],
      permissions: QUERY_PERMS,
      roleIds: [ROLE.STAFF],
      username: 'self-a',
    },
    {
      id: USER.TENANT_A_PEER,
      tenantId: TENANT_A,
      deptId: DEPT.A_CHILD,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: false,
      roles: ['staff'],
      permissions: QUERY_PERMS,
      roleIds: [ROLE.STAFF],
      username: 'peer-a',
    },
    {
      id: USER.TENANT_B_ADMIN,
      tenantId: TENANT_B,
      deptId: DEPT.B_ROOT,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: false,
      roles: [TENANT_ADMIN_ROLE_CODE],
      permissions: ADMIN_PERMS,
      roleIds: [ROLE.TENANT_ADMIN],
      username: 'admin-b',
    },
    {
      id: USER.SUPER_ADMIN,
      tenantId: TENANT_A,
      deptId: DEPT.A_ROOT,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: false,
      roles: [SYSTEM_ADMIN_ROLE_CODE],
      permissions: [],
      roleIds: [ROLE.SUPER],
      username: 'super',
    },
    {
      id: USER.MUST_CHANGE,
      tenantId: TENANT_A,
      deptId: DEPT.A_ROOT,
      status: CommonStatusEnum.ENABLE,
      permVersion: 1,
      mustChangePassword: true,
      roles: [TENANT_ADMIN_ROLE_CODE],
      permissions: ADMIN_PERMS,
      roleIds: [ROLE.TENANT_ADMIN],
      username: 'must-change',
    },
  ];
}

function seedDepts(): MemDept[] {
  const now = new Date();
  return [
    {
      id: DEPT.A_ROOT,
      tenantId: TENANT_A,
      name: 'A-root',
      parentId: 0,
      sort: 1,
      status: 1,
      deleted: false,
      createTime: now,
    },
    {
      id: DEPT.A_CHILD,
      tenantId: TENANT_A,
      name: 'A-child',
      parentId: DEPT.A_ROOT,
      sort: 2,
      status: 1,
      deleted: false,
      createTime: now,
    },
    {
      id: DEPT.A_SCOPED,
      tenantId: TENANT_A,
      name: 'A-scoped',
      parentId: 0,
      sort: 3,
      status: 1,
      deleted: false,
      createTime: now,
    },
    {
      id: DEPT.A_EMPTY,
      tenantId: TENANT_A,
      name: 'A-empty',
      parentId: 0,
      sort: 4,
      status: 1,
      deleted: false,
      createTime: now,
    },
    {
      id: DEPT.B_ROOT,
      tenantId: TENANT_B,
      name: 'B-root',
      parentId: 0,
      sort: 1,
      status: 1,
      deleted: false,
      createTime: now,
    },
  ];
}

function seedRoles(): MemRole[] {
  return [
    {
      id: ROLE.TENANT_ADMIN,
      code: TENANT_ADMIN_ROLE_CODE,
      status: 1,
      dataScope: DataScopeEnum.ALL,
      dataScopeDeptIds: [DEPT.A_SCOPED],
    },
    {
      id: ROLE.STAFF,
      code: 'staff',
      status: 1,
      dataScope: DataScopeEnum.SELF,
      dataScopeDeptIds: [],
    },
    {
      id: ROLE.SUPER,
      code: SYSTEM_ADMIN_ROLE_CODE,
      status: 1,
      dataScope: DataScopeEnum.ALL,
      dataScopeDeptIds: [],
    },
  ];
}

class HttpContractWorld {
  users: MemUser[] = [];
  depts: MemDept[] = [];
  roles: MemRole[] = [];
  tokens = new Map<string, MemToken>();
  tokenSeq = 1;
  maxSessions = 2;

  reset() {
    this.users = seedUsers();
    this.depts = seedDepts();
    this.roles = seedRoles();
    this.tokens.clear();
    this.tokenSeq = 1;
    this.maxSessions = 2;
  }

  user(id: number): MemUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  toRoleDO(role: MemRole): RoleDO {
    return {
      id: role.id,
      name: role.code,
      code: role.code,
      sort: role.id,
      status: role.status,
      type: 1,
      remark: '',
      dataScope: role.dataScope,
      dataScopeDeptIds: role.dataScopeDeptIds,
      tenantId: TENANT_A,
    } as RoleDO;
  }
}

export const httpContractWorld = new HttpContractWorld();
httpContractWorld.reset();
