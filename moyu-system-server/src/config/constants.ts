/**
 * 全局常量定义
 *
 * 集中管理应用中的魔法值，避免硬编码散落在各处。
 * 修改配置只需调整此处，无需全局搜索替换。
 */

/** YAML 配置文件名 */
export const YAML_CONFIG_FILENAME = 'config.yaml';

// ─── 装饰器元数据 Key ──────────────────────────────────
export const SKIP_AUTH_KEY = 'skipAuth';           // @SkipAuth() 跳过认证
export const RAW_RESPONSE_KEY = 'rawResponse';     // @RawResponse() 跳过响应包装
export const ROLES_KEY = 'roles';                  // @Roles() 角色标记
export const PERMISSION_KEY = 'permission';         // @Permission() 权限标记
export const PERMISSION_MODE_KEY = 'permissionMode'; // @PermissionMode() 权限语义
export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck'; // @SkipTenantCheck() 跳过租户隔离

/** 请求头：租户编号（登录前选择租户 / 超管切换租户） */
export const TENANT_ID_HEADER = 'tenant-id';

/** 系统默认租户（未指定时） */
export const DEFAULT_TENANT_ID = '0';

// ─── 分页默认值 ──────────────────────────────────────
export const DEFAULT_PAGE = 1;     // 默认页码
export const DEFAULT_LIMIT = 20;   // 默认每页条数

// ─── 单据编号前缀（业务扩展预留，当前 system 模块未使用） ──
// export const ORDER_NUMBER_PREFIX = 'ORD';
// export const REFUND_NUMBER_PREFIX = 'RFD';

// ─── 密码与登录安全策略 ──────────────────────────────
export const PASSWORD_EXPIRE_DAYS = 90;        // 密码有效期（天）
export const MAX_LOGIN_ATTEMPTS = 5;           // 最大登录失败次数
export const LOCK_DURATION_MINUTES = 15;       // 账号锁定时长（分钟）
/** 最近 N 次使用过的密码不可重复使用 */
export const PASSWORD_HISTORY_LIMIT = 3;
/** 登录失败计数 Redis Key 前缀：login:fail:{tenantId}:{username} */
export const LOGIN_FAIL_PREFIX = 'login:fail';
/** 操作日志装饰器元数据 Key */
export const OPERATE_LOG_KEY = 'operateLog';

/**
 * 通用状态（菜单、用户、角色、租户等 status 字段）
 * 0 关闭 / 1 开启
 */
export const CommonStatusEnum = {
  DISABLE: 0,
  ENABLE: 1,
} as const;

/**
 * 角色数据范围
 * 多角色取并集：任一角色为 ALL 则不过滤；否则合并部门/本人条件
 */
export const DataScopeEnum = {
  /** 全部数据权限 */
  ALL: 1,
  /** 指定部门数据权限 */
  DEPT_CUSTOM: 2,
  /** 本部门数据权限 */
  DEPT_ONLY: 3,
  /** 本部门及以下数据权限 */
  DEPT_AND_CHILD: 4,
  /** 仅本人数据权限 */
  SELF: 5,
} as const;

// ─── Token 有效期 ──────────────────────────────────
export const ACCESS_TOKEN_EXPIRE = '15m';                               // Access Token 有效期
export const REFRESH_TOKEN_EXPIRE = '7d';                               // Refresh Token 有效期
export const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;                 // 24小时（毫秒）
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;    // 7天（毫秒）

// ─── 日期格式 ──────────────────────────────────────
export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'; // 日期时间格式
export const DATE_ONLY_FORMAT = 'YYYY-MM-DD';      // 仅日期格式

// ─── 系统角色编码 ──────────────────────────────────
export const SYSTEM_ADMIN_ROLE_CODE = 'super_admin'; // 超级管理员角色编码
export const ADMIN_ROLE_CODE = 'admin';               // 普通管理员角色编码
export const TENANT_ADMIN_ROLE_CODE = 'tenant_admin'; // 租户管理员角色编码
/** 内置管理员账号，禁止关闭状态 / 删除 */
export const ADMIN_USERNAME = 'admin';
/** 系统管理目录（禁止关闭状态） */
export const SYSTEM_MENU_ROOT_PATH = '/admin';
export const SYSTEM_MENU_ROOT_NAME = '系统管理';

/** 用户导入须显式配置环境变量 USER_IMPORT_DEFAULT_PASSWORD（禁止内置弱口令） */
/**
 * 社交平台类型
 */
export const SocialTypeEnum = {
  GITEE: 10,
  DING_TALK: 20,
  WECHAT_ENTERPRISE: 30,
  WECHAT_MP: 31,
  WECHAT_OPEN: 32,
  WECHAT_MINI_PROGRAM: 34,
  /** 早期自建：企业微信 */
  WECHAT_ENTERPRISE_LEGACY: 1,
  /** 早期自建：钉钉 */
  DING_TALK_LEGACY: 2,
} as const;

/** 短信验证码场景 → 模板编码（可用环境变量覆盖） */
export function resolveSmsTemplateCode(scene: number): string {
  if (scene === 1) {
    return process.env.SMS_TEMPLATE_LOGIN || 'admin-sms-login';
  }
  if (scene === 3) {
    return process.env.SMS_TEMPLATE_RESET_PASSWORD || 'admin-reset-password';
  }
  return process.env.SMS_TEMPLATE_CODE || `admin-sms-scene-${scene}`;
}

// ─── 文件上传路径 ──────────────────────────────────
export const APP_UPLOAD_PATH = 'uploads'; // 文件上传根目录
export const APP_ADDONS_PATH = 'addons'; // 插件目录

// Redis 相关常量（验证码 / 短信）
export const CAPTCHA_CODE_PREFIX = 'captcha:code';       // 图形验证码 Key 前缀
export const CAPTCHA_CODE_EXPIRE = 5 * 60 * 1000;        // 图形验证码有效期 5 分钟（毫秒）
export const SMS_CODE_PREFIX = 'sms:code';               // 短信验证码 Key 前缀
export const SMS_CODE_EXPIRE = 10 * 60 * 1000;           // 短信验证码有效期 10 分钟（毫秒）
export const SMS_RESEND_INTERVAL = 60 * 1000;            // 短信重发最小间隔 60 秒（毫秒）
export const SMS_CODE_DAILY_LIMIT = 10;                  // 同一手机号+场景每日发送上限
export const SOCIAL_OAUTH_STATE_PREFIX = 'social:oauth:state'; // 社交授权 state
export const SOCIAL_OAUTH_STATE_EXPIRE = 10 * 60 * 1000; // state 有效期 10 分钟

// ─── OAuth2 / 令牌相关常量 ─────────────────────────
export const OAUTH2_DEFAULT_CLIENT_ID = 'default';       // 系统内置 OAuth2 客户端编号（后端登录默认使用）
export const OAUTH2_DEFAULT_SCOPE = 'user_info';         // 默认授权范围
export const USER_TYPE_ADMIN = 1;                        // 用户类型：管理后台用户
export const USER_TYPE_MEMBER = 2;                       // 用户类型：会员用户

// Queue 相关常量
export const MEDIA_QUEUE = 'media';
/** 邮件发送队列 */
export const MAIL_SEND_QUEUE = 'mail-send';
/** 短信发送队列 */
export const SMS_SEND_QUEUE = 'sms-send';

/** 权限 bundle 缓存前缀与 TTL */
export const PERMISSION_BUNDLE_CACHE_PREFIX = 'sys:perm:bundle';
export const PERMISSION_BUNDLE_CACHE_TTL_MS = 10 * 60_000;

/** 租户可用性判定缓存前缀与 TTL（请求级校验用，避免每请求查库） */
export const TENANT_ACTIVE_CACHE_PREFIX = 'sys:tenant:active';
export const TENANT_ACTIVE_CACHE_TTL_MS = 30_000;

/** 公共路径 — 跳过响应包装、限流等处理 */
export const PUBLIC_PATHS = [
  '/health',
  '/api-docs',
  '/static/',
];

/**
 * JWT 认证白名单（路径匹配，忽略全局 apiPrefix）
 * 与 @SkipAuth 双保险：装饰器失效时仍放行登录/探测类匿名接口
 */
export const AUTH_WHITELIST = [
  '/health',
  '/api-docs',
  '/static/',
  // 认证（匿名）
  '/auth/login',
  '/auth/logout',
  '/auth/refresh-token',
  '/auth/register',
  '/auth/sms-login',
  '/auth/send-sms-code',
  '/auth/reset-password',
  '/auth/social-auth-redirect',
  '/auth/social-login',
  // 验证码
  '/captcha/',
  // 登录前租户探测
  '/tenant/get-by-website',
  '/tenant/get-id-by-name',
  '/tenant/simple-list',
  // OAuth2 开放端点 / 短信回调
  '/oauth2-open/',
  '/sms-callback/',
];

/**
 * 被要求强制改密（mustChangePassword）时仍可访问的接口前缀
 *
 * 仅放行「改密码 / 拿用户信息 / 登出 / 换令牌」四类，其余接口一律拒绝，
 * 避免管理员重置密码后用户绕过改密要求继续使用系统。
 */
export const MUST_CHANGE_PASSWORD_WHITELIST = [
  '/auth/logout',
  '/auth/refresh-token',
  '/user-profile/',
];
