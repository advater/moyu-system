import qs from "qs";

import Token from "@/utils/token";
import { omitData } from "@/utils/object";
import { getTenantId, resyncPermission, ssoLogout } from "@/utils/auth";
import { ssoMessage } from "@/utils/index";
import { bus } from "@/utils/bus";
import { env } from "@/config/env";
import { isCurrentAuthPath } from "@/router/auth";

import httpRequest from "./axios";

/** 接口前缀，对应 `VITE_API_URL=/admin` */
export const API_PREFIX = env.apiUrl;

export type PageParam = {
  page?: number;
  pageSize?: number;
  [key: string]: any;
};

export function systemUrl(path: string) {
  return `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

type TMethod = "get" | "post" | "put" | "patch" | "delete" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type TData = Record<string, any>;
type THeaders = Record<string, string>;
type TRequest = {
  url: string;
  method?: TMethod;
  data?: TData;
  headers?: THeaders;
  otherConfig?: Record<string, any>;
};

const Refresh_URL = `${API_PREFIX}/auth/refresh-token`;

function toAdminUrl(url: string) {
  if (url.startsWith("http") || url.startsWith(API_PREFIX)) return url;
  const [pathname, search = ""] = url.split("?");
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  path = path.replace(/^\/user\/profile(\/|$)/, "/user-profile$1");
  return `${API_PREFIX}${path}${search ? `?${search}` : ""}`;
}

const TENANT_PAYLOAD_KEYS = new Set(["orgi", "tenantId", "tenant_id"]);

function omitTenantPayload<T>(data: T): T {
  if (!data || typeof data !== "object") return data;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    TENANT_PAYLOAD_KEYS.forEach((key) => data.delete(key));
    return data;
  }
  if (Array.isArray(data)) return data;
  const next: Record<string, any> = {};
  Object.entries(data as Record<string, any>).forEach(([key, value]) => {
    if (TENANT_PAYLOAD_KEYS.has(key)) return;
    next[key] = value;
  });
  return next as T;
}

function stripTenantFromUrl(url: string) {
  const [pathname, search = ""] = url.split("?");
  if (!search) return url;
  const params = new URLSearchParams(search);
  let changed = false;
  TENANT_PAYLOAD_KEYS.forEach((key) => {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  });
  if (!changed) return url;
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

function cleanParams(params?: Record<string, any>) {
  if (!params) return undefined;
  const next: Record<string, any> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (TENANT_PAYLOAD_KEYS.has(key)) return;
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    next[key] = value;
  });
  return Object.keys(next).length ? next : undefined;
}

function unwrap<T = any>(res: any): T {
  if (res && typeof res === "object" && "data" in res && "code" in res) {
    return res.data as T;
  }
  return res as T;
}

function buildUrl(url: string, method: TMethod, data?: TData) {
  let finalUrl = toAdminUrl(url);
  if (method.toUpperCase() === "GET" && data) {
    const query = qs.stringify(data, { allowDots: true, skipNulls: true, arrayFormat: "repeat" });
    if (query) finalUrl += finalUrl.includes("?") ? `&${query}` : `?${query}`;
  }
  return finalUrl;
}

function buildHeaders(customHeaders?: THeaders): THeaders {
  const headers: THeaders = { domainName: window.location.host };
  const token = Token.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = getTenantId();
  if (tenantId) headers["tenant-id"] = tenantId;
  return { ...headers, ...customHeaders };
}

function applyRefreshedTokens(headers: Record<string, any>, bodyData?: any) {
  const headerToken = headers.authorization?.replace("Bearer ", "");
  const bodyToken = bodyData?.accessToken || bodyData?.token;
  const access = headerToken || bodyToken;
  if (access) Token.setToken(access);
  if (bodyData?.refreshToken) Token.setRefreshToken(bodyData.refreshToken);
}

/** 权限已变更导致令牌失效（后端 catch-exception.filter 透出的 errorCode） */
const PERMISSION_VERSION_MISMATCH = "AUTH.PERMISSION_VERSION_MISMATCH";
/** 刷新令牌重放：整族会话已被吊销，需原样展示后端文案 */
const REFRESH_TOKEN_REPLAYED = "AUTH.REFRESH_TOKEN_REPLAYED";
/** 令牌已被换掉（多标签页并发轮换时，抢输的那个标签页会拿到此码） */
const INVALID_RESET_TOKEN = "AUTH.INVALID_RESET_TOKEN";

type TRefreshResult = { ok: boolean; errorCode?: string; message?: string };

let refreshPromise: Promise<TRefreshResult> | null = null;
const MAX_REFRESH_RETRY = 1;
const REFRESH_RETRY_DELAY_MS = 300;

/** 登录/注册/找回密码等匿名接口：失败时不要去刷 token */
function isAnonymousAuthUrl(url: string) {
  return (
    /\/auth\/(login|register|logout|refresh-token|sms-login|send-sms-code|reset-password|social-login|social-auth-redirect)(?:\?|$)/.test(
      url,
    ) || /\/captcha\//.test(url)
  );
}

function shouldSkipTokenRefresh(url?: string) {
  if (isCurrentAuthPath()) return true;
  if (url && isAnonymousAuthUrl(url)) return true;
  return false;
}

function requestRefreshToken(): Promise<TRefreshResult> {
  if (shouldSkipTokenRefresh()) return Promise.resolve({ ok: false });
  const refreshToken = Token.getRefreshToken();
  return send({
    url: Refresh_URL,
    method: "post",
    // Cookie 优先；Body.refreshToken 兼容 Cookie 没带上的情况
    data: refreshToken ? { refreshToken } : {},
    otherConfig: { __isRefreshToken: true },
  })
    .then((res: any): TRefreshResult => {
      if (res?.code === 200) return { ok: true };
      return { ok: false, errorCode: res?.errorCode, message: res?.message };
    })
    .catch((err: any): TRefreshResult => {
      const payload = err?.response?.data ?? err;
      return { ok: false, errorCode: payload?.errorCode, message: payload?.message };
    });
}

async function refreshToken(): Promise<TRefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    let result: TRefreshResult = { ok: false };
    for (let attempt = 0; attempt <= MAX_REFRESH_RETRY; attempt += 1) {
      if (attempt > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, REFRESH_RETRY_DELAY_MS);
        });
      }
      result = await requestRefreshToken();
      if (result.ok || result.errorCode !== INVALID_RESET_TOKEN) return result;
    }
    return result;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * 启动/无本地令牌时静默换令牌。
 * 失败不提示、不登出（匿名访问属正常情况），由调用方决定后续流程。
 */
export async function trySilentRefresh(): Promise<boolean> {
  if (shouldSkipTokenRefresh()) return false;
  const result = await refreshToken();
  return result.ok;
}

function failSession(result: TRefreshResult) {
  const precise = result.errorCode === REFRESH_TOKEN_REPLAYED ? result.message : undefined;
  ssoMessage(precise || "登录状态已过期,请重新登录");
  ssoLogout();
}

function replayConfig(response: any): TRequest {
  const { url, method, data, headers } = response.config || {};
  const headObj = Object.fromEntries(Object.entries(headers || {})) as Record<string, string>;
  const nextHeaders = omitData(headObj, "Authorization", "Accept", "domainName");
  const options: TRequest = {
    url,
    method,
    headers: nextHeaders,
    otherConfig: { __retriedAfterRefresh: true },
  };
  if (String(method || "").toUpperCase() !== "GET") options.data = data;
  return options;
}

async function handle401(response: any): Promise<any> {
  const result = await refreshToken();
  if (!result.ok) {
    failSession(result);
    throw { code: 401, message: result.message || "登录状态已过期,请重新登录" };
  }
  return send(replayConfig(response));
}

let permResyncPromise: Promise<void> | null = null;

function resyncPermissionOnce(): Promise<void> {
  if (!permResyncPromise) {
    permResyncPromise = resyncPermission()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        permResyncPromise = null;
      });
  }
  return permResyncPromise;
}

async function handlePermissionMismatch(response: any): Promise<any> {
  const result = await refreshToken();
  if (!result.ok) {
    failSession(result);
    throw { code: 401, message: result.message || "登录状态已过期,请重新登录" };
  }
  await resyncPermissionOnce();
  return send(replayConfig(response));
}

function send<T = any>({
  url,
  method = "GET",
  data,
  headers: customHeaders = {},
  otherConfig = {},
}: TRequest): Promise<T> {
  return (async () => {
    const { __isRefreshToken, __retriedAfterRefresh, ...otherOptions } = otherConfig;

    // 已有刷新在飞：后来的业务请求等新票，避免带着过期 access 打出去再失败
    if (!__isRefreshToken && refreshPromise && !shouldSkipTokenRefresh(url)) {
      const waiting = await refreshPromise;
      if (!waiting.ok) {
        throw { code: 401, message: waiting.message || "登录状态已过期,请重新登录" };
      }
    }

    const headers = buildHeaders(customHeaders);
    const payload = omitTenantPayload(data);
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
    const reqConfig = {
      url: stripTenantFromUrl(buildUrl(url, method, payload)),
      method,
      headers,
      otherConfig: otherOptions,
      data: method.toUpperCase() === "GET" ? undefined : payload,
    };

    try {
      const response = await httpRequest<T>(reqConfig);
      if (__isRefreshToken) {
        applyRefreshedTokens(response.headers, (response.data as any)?.data);
      }
      const responseType = reqConfig.otherConfig?.responseType;
      if (responseType === "text" || responseType === "blob") {
        return response.data as T;
      }
      const { data: apiData } = response;
      const apiCode = (apiData as Record<string, any>)?.code;
      if (apiCode && (apiCode < 200 || apiCode >= 300)) {
        throw { response };
      }
      return apiData as T;
    } catch (err: any) {
      const response = err?.response;
      if (!response) {
        if (err?.code === 401) throw err;
        if (
          err?.code === 490 ||
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError" ||
          err?.name === "AbortError"
        ) {
          throw { code: 490, message: "Upload aborted", name: "AbortError" };
        }
        ssoMessage("网络异常");
        throw { message: "网络异常" };
      }
      const { data: apiData } = response;
      if (apiData?.code === 490 || response.status === 490) {
        throw { code: 490, message: "Upload aborted", name: "AbortError" };
      }
      if (apiData?.code === 401 && !__isRefreshToken) {
        const reqUrl = String(url || reqConfig.url || "");
        if (shouldSkipTokenRefresh(reqUrl) || __retriedAfterRefresh) {
          throw apiData;
        }
        if (apiData?.errorCode === PERMISSION_VERSION_MISMATCH && !permResyncPromise) {
          return handlePermissionMismatch(response);
        }
        return handle401(response);
      }
      const errText =
        (typeof apiData?.message === "string" && apiData.message) ||
        (typeof apiData?.msg === "string" && apiData.msg) ||
        "请求失败";
      if (!__isRefreshToken) {
        ssoMessage(errText);
        if (apiData?.code === 403 && errText === "请先选择租户") {
          bus.emit("tenant:select-required");
        }
      }
      throw apiData;
    }
  })();
}

export const request = {
  get<T = any>(opts: { url: string; params?: Record<string, any> }) {
    return send({ url: opts.url, method: "get", data: cleanParams(opts.params) }).then(unwrap<T>);
  },
  post<T = any>(opts: { url: string; data?: any; otherConfig?: Record<string, any> }) {
    return send({
      url: opts.url,
      method: "post",
      data: opts.data,
      otherConfig: opts.otherConfig,
    }).then(unwrap<T>);
  },
  put<T = any>(opts: { url: string; data?: any; params?: Record<string, any> }) {
    const query = opts.params
      ? `?${qs.stringify(cleanParams(opts.params), { arrayFormat: "repeat", skipNulls: true })}`
      : "";
    return send({ url: `${opts.url}${query}`, method: "put", data: opts.data }).then(unwrap<T>);
  },
  delete<T = any>(opts: { url: string; params?: Record<string, any>; data?: any }) {
    const query = opts.params
      ? `?${qs.stringify(cleanParams(opts.params), { arrayFormat: "repeat", skipNulls: true })}`
      : "";
    return send({ url: `${opts.url}${query}`, method: "delete", data: opts.data }).then(unwrap<T>);
  },
  download(opts: { url: string; params?: Record<string, any> }) {
    return send<Blob>({
      url: opts.url,
      method: "get",
      data: cleanParams(opts.params),
      otherConfig: { responseType: "blob" },
    });
  },
  upload<T = any>(opts: { url: string; data?: any }) {
    return send({
      url: opts.url,
      method: "post",
      data: opts.data,
      otherConfig: { timeout: 120000 },
    }).then(unwrap<T>);
  },
};

export { downloadExcel } from "@/utils/file/down";
