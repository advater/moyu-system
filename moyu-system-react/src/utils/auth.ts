import store from "@/store";
import Storage from "@/utils/storage";
import Token from "@/utils/token";
import { deleteLogout, getInfo } from "@/api/login";
import { setRoles, setUserInfo, resetUser } from "@/store/stores/user";
import { setPermissionTree, clearPermission } from "@/store/stores/permission";
import { setTenantState, resetTenant } from "@/store/stores/tenant";
import { loadDictMap, resetDict } from "@/store/stores/dict";
import { closeAll } from "@/store/stores/tagsView";
import type { ISessionInfo, ITenantOption } from "@/types/permission";
import { env } from "@/config/env";
import { setMustChangePassword } from "@/utils/mustChangePassword";
import { navigateApp } from "@/router/navigation";

const TENANT_ID_KEY = "TENANT_ID";

/** 当前租户编号（与 Vue3 tenant-id 请求头对齐） */
export function getTenantId(): string {
  const stored = localStorage.getItem(TENANT_ID_KEY);
  if (stored != null && stored !== "") return stored;
  const user = (Storage.get("USER_DATA") || {}) as Record<string, any>;
  const id = user.tenant_id ?? user.tenantId;
  if (id === 0 || id === "0") return "0";
  return id != null && id !== "" ? String(id) : "";
}

export function setTenantId(id: number | string) {
  localStorage.setItem(TENANT_ID_KEY, String(id));
  const user = (Storage.get("USER_DATA") || {}) as Record<string, any>;
  user.tenant_id = id;
  user.tenantId = id;
  Storage.set("USER_DATA", user);
}

type Tokens = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
};

/** 登录成功：写入 access + refresh（refresh 同时给 Cookie 与本地兜底） */
export function setLogin(data: Tokens) {
  Token.setToken(data.token || data.accessToken || "");
  if (data.refreshToken) Token.setRefreshToken(data.refreshToken);
}

function resolveTenants(user: Record<string, any> | undefined): ITenantOption[] {
  const list = user?.tenants;
  if (!Array.isArray(list)) return [];
  return list.map((item: any) => ({
    id: Number(item.id),
    name: item.name || `租户 ${item.id}`,
  }));
}

export function applySession(info: ISessionInfo) {
  const user = info.user || {};
  const tenantId = user.tenant_id ?? user.tenantId;
  const tenants = resolveTenants(user);
  const needSelect =
    env.tenantEnable &&
    (tenantId === null || tenantId === undefined || tenantId === "") &&
    tenants.length > 0;

  store.dispatch(setUserInfo(user));
  store.dispatch(setRoles(info.roles || []));
  Storage.set("USER_DATA", user);

  store.dispatch(
    setTenantState({
      tenantId: tenantId ?? "",
      tenants,
      selectRequired: needSelect,
      tenantEnable: env.tenantEnable,
    }),
  );

  if (!needSelect) {
    store.dispatch(setPermissionTree(info as any));
  }

  return { user, needSelect, tenants };
}

let bootstrapInflight: Promise<{
  info: ISessionInfo;
  user: Record<string, any>;
  needSelect: boolean;
  tenants: ITenantOption[];
}> | null = null;

export async function bootstrapSession() {
  if (bootstrapInflight) return bootstrapInflight;
  bootstrapInflight = (async () => {
    const info = (await getInfo()) as ISessionInfo;
    const result = applySession(info);
    loadDictMap().catch(() => {});
    return { info, ...result };
  })().finally(() => {
    bootstrapInflight = null;
  });
  return bootstrapInflight;
}

/**
 * 重新拉取权限/菜单（令牌权限版本失效后调用）
 * 不参与 bootstrapSession 单飞：请求拦截器内触发重拉时，复用单飞会自等待死锁
 */
export async function resyncPermission() {
  const info = (await getInfo()) as ISessionInfo;
  applySession(info);
  return info;
}

export async function switchTenant(tenantId: number | string) {
  setTenantId(tenantId);
  const user = {
    ...((store.getState().user.userInfo || Storage.get("USER_DATA") || {}) as Record<string, any>),
    tenant_id: tenantId,
    tenantId,
  };
  store.dispatch(setUserInfo(user));
  Storage.set("USER_DATA", user);
  store.dispatch(setTenantState({ tenantId, selectRequired: false }));
  store.dispatch(clearPermission());
  const info = (await getInfo()) as ISessionInfo;
  applySession(info);
  return info;
}

export function resetSession() {
  store.dispatch(resetUser());
  store.dispatch(clearPermission());
  store.dispatch(resetTenant());
  store.dispatch(resetDict());
  store.dispatch(closeAll());
  Storage.remove("USER_DATA");
  Token.clearToken();
  Token.clearRefreshToken();
  setMustChangePassword(false);
}

let loggingOut = false;

/**
 * 安全退出：调后端清 httpOnly Cookie，再清本地会话，走前端路由
 */
export async function ssoLogout(path = "/login") {
  if (loggingOut) return;
  loggingOut = true;
  try {
    try {
      await deleteLogout();
    } catch {
      // 后端 logout 失败也不阻塞退出
    }
    resetSession();
    navigateApp(path, { replace: true });
  } finally {
    loggingOut = false;
  }
}
