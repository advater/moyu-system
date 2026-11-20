import { AsyncLocalStorage } from 'node:async_hooks';
import { TenantError } from '@/config/error-messages';

/** 租户请求上下文 */
export interface TenantStore {
  /** 当前租户编号；未登录 / 跳过隔离时可为 null */
  tenantId: string | null;
  /** true 时 Prisma 不注入租户条件（平台级运维、登录前查库等） */
  ignore: boolean;
}

const storage = new AsyncLocalStorage<TenantStore>();

/**
 * 租户上下文（AsyncLocalStorage）
 *
 * 由 TenantMiddleware 建立空 store，TenantGuard / 业务代码写入 tenantId。
 * PrismaService 扩展在读/写带 tenantId 的模型时读取本上下文。
 */
export const TenantContext = {
  run<T>(store: TenantStore, fn: () => T): T {
    return storage.run(store, fn);
  },

  getStore(): TenantStore | undefined {
    return storage.getStore();
  },

  /** 当前租户；无上下文时返回 null */
  getTenantId(): string | null {
    const store = storage.getStore();
    if (!store || store.ignore) return null;
    return store.tenantId;
  },

  /** 业务写入必须有租户时使用 */
  requireTenantId(fallback?: string): string {
    const id = this.getTenantId() ?? fallback;
    if (!id) {
      throw new Error(TenantError.CONTEXT_MISSING);
    }
    return id;
  },

  setTenantId(tenantId: string): void {
    const store = storage.getStore();
    if (store) {
      store.tenantId = tenantId;
      store.ignore = false;
    }
  },

  /** 跳过租户隔离（平台租户管理等） */
  setIgnore(ignore = true): void {
    const store = storage.getStore();
    if (store) {
      store.ignore = ignore;
    }
  },

  isIgnored(): boolean {
    return storage.getStore()?.ignore === true;
  },
};

/** 带 tenantId 字段、需隔离的 Prisma 模型名 */
export const TENANT_SCOPED_MODELS = new Set([
  // 组织与账号
  'SysDept',
  'SysUser',
  'SysUserProfile',
  'SysPost',
  'SysUserPost',
  'SysUserPasswordHistory',
  'SysRole',
  'SysRoleMenu',
  'SysUserRole',
  // 字典 / 参数配置 / 公告 / 站内信
  'SysDictType',
  'SysDictData',
  'SysConfig',
  'SysFile',
  'SysFileUpload',
  'SysNotice',
  'SysNotifyTemplate',
  'SysNotifyMessage',
  // 邮件 / 短信
  'SysMailAccount',
  'SysMailTemplate',
  'SysMailLog',
  'SysSmsChannel',
  'SysSmsTemplate',
  'SysSmsLog',
  'SysSmsCode',
  // 社交 / OAuth2
  'SysSocialClient',
  'SysSocialUser',
  'SysSocialUserBind',
  'SysOAuth2Client',
  'SysOAuth2AccessToken',
  'SysOAuth2RefreshToken',
  'SysOAuth2Code',
  'SysOAuth2Approve',
  // 审计
  'SysLoginLog',
  'SysOperateLog',
  'SysApiAccessLog',
  'SysApiErrorLog',
  // 错误码
  'SysErrorCode',
]);

/**
 * 平台共享（不加 tenantId）的模型说明：
 * - SysMenu：全平台菜单，由租户套餐 menuIds 裁剪
 * - SysTenant / SysTenantPackage：平台级租户与套餐
 * - SysJob / SysJobLog：平台级定时任务与执行日志
 */