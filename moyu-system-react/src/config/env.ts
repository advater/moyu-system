function strip(value?: string) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function flag(value?: string, fallback = false) {
  if (value == null || value === "") return fallback;
  return strip(value) === "true";
}

/** 运行时环境配置，对应根目录 `.env*` */
export const env = {
  title: strip(import.meta.env.VITE_APP_TITLE) || "moyu",
  baseUrl: strip(import.meta.env.VITE_BASE_URL),
  apiUrl: strip(import.meta.env.VITE_API_URL) || "/admin",
  basePath: strip(import.meta.env.VITE_BASE_PATH) || "/",
  isDev: flag(import.meta.env.VITE_DEV, import.meta.env.DEV),
  tenantEnable: flag(import.meta.env.VITE_APP_TENANT_ENABLE, true),
  captchaEnable: flag(import.meta.env.VITE_APP_CAPTCHA_ENABLE, false),
  uploadType: strip(import.meta.env.VITE_UPLOAD_TYPE) || "server",
  defaultLogin: {
    tenantName: strip(import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT),
    username: strip(import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME),
    password: strip(import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD),
  },
};

/** axios 开发走 Vite 代理，打包后直连后端 */
export function resolveAxiosBaseURL() {
  return env.isDev ? "" : env.baseUrl;
}

/** 大文件分片走后端源站，避免 Vite 代理把大体量 POST 重置掉 */
export function resolveFileApiBase() {
  const api = (env.apiUrl || "/admin").replace(/\/$/, "");
  if (/^https?:\/\//i.test(api)) return api;
  const origin = (env.baseUrl || "").replace(/\/$/, "").replace(
    /:\/\/localhost\b/i,
    "://127.0.0.1",
  );
  if (origin) return `${origin}${api.startsWith("/") ? api : `/${api}`}`;
  return api;
}

export function resolveRouterBasename() {
  const path = env.basePath.replace(/\/$/, "") || "/";
  return path === "/" ? undefined : path;
}
