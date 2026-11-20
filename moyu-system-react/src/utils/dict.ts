export const DICT_TYPE = {
  USER_TYPE: "user_type",
  COMMON_STATUS: "common_status",
  SYSTEM_USER_SEX: "system_user_sex",
  SYSTEM_MENU_TYPE: "system_menu_type",
  SYSTEM_ROLE_TYPE: "system_role_type",
  SYSTEM_DATA_SCOPE: "system_data_scope",
  SYSTEM_NOTICE_TYPE: "system_notice_type",
  SYSTEM_LOGIN_TYPE: "system_login_type",
  SYSTEM_LOGIN_RESULT: "system_login_result",
  SYSTEM_SMS_CHANNEL_CODE: "system_sms_channel_code",
  SYSTEM_SMS_TEMPLATE_TYPE: "system_sms_template_type",
  SYSTEM_SMS_SEND_STATUS: "system_sms_send_status",
  SYSTEM_SMS_RECEIVE_STATUS: "system_sms_receive_status",
  SYSTEM_OAUTH2_GRANT_TYPE: "system_oauth2_grant_type",
  SYSTEM_MAIL_SEND_STATUS: "system_mail_send_status",
  SYSTEM_NOTIFY_TEMPLATE_TYPE: "system_notify_template_type",
  SYSTEM_SOCIAL_TYPE: "system_social_type",
  INFRA_BOOLEAN_STRING: "infra_boolean_string",
  INFRA_JOB_STATUS: "infra_job_status",
  INFRA_JOB_LOG_STATUS: "infra_job_log_status",
  INFRA_API_ERROR_LOG_PROCESS_STATUS: "infra_api_error_log_process_status",
  INFRA_CONFIG_TYPE: "infra_config_type",
} as const;

export interface DictOption {
  label: string;
  value: number | string | boolean;
  color?: string;
}

const STATIC_DICT: Record<string, DictOption[]> = {
  [DICT_TYPE.COMMON_STATUS]: [
    { label: "关闭", value: 0, color: "error" },
    { label: "开启", value: 1, color: "success" },
  ],
  [DICT_TYPE.USER_TYPE]: [
    { label: "会员", value: 1 },
    { label: "管理员", value: 2 },
  ],
  [DICT_TYPE.SYSTEM_USER_SEX]: [
    { label: "未知", value: 0 },
    { label: "男", value: 1 },
    { label: "女", value: 2 },
  ],
  [DICT_TYPE.SYSTEM_MENU_TYPE]: [
    { label: "目录", value: 1 },
    { label: "菜单", value: 2 },
    { label: "按钮", value: 3 },
  ],
  [DICT_TYPE.SYSTEM_ROLE_TYPE]: [
    { label: "内置", value: 1 },
    { label: "自定义", value: 2 },
  ],
  [DICT_TYPE.SYSTEM_DATA_SCOPE]: [
    { label: "全部数据权限", value: 1 },
    { label: "指定部门数据权限", value: 2 },
    { label: "部门数据权限", value: 3 },
    { label: "部门及以下数据权限", value: 4 },
    { label: "仅本人数据权限", value: 5 },
  ],
  [DICT_TYPE.SYSTEM_NOTICE_TYPE]: [
    { label: "通知", value: 1 },
    { label: "公告", value: 2 },
  ],
  [DICT_TYPE.SYSTEM_LOGIN_TYPE]: [
    { label: "账号登录", value: 100 },
    { label: "社交登录", value: 101 },
    { label: "短信登录", value: 103 },
  ],
  [DICT_TYPE.SYSTEM_LOGIN_RESULT]: [
    { label: "成功", value: 0, color: "success" },
    { label: "账号或密码不正确", value: 10, color: "error" },
    { label: "用户被禁用", value: 20, color: "error" },
    { label: "验证码不正确", value: 30, color: "error" },
    { label: "未知异常", value: 100, color: "error" },
  ],
  [DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE]: [
    { label: "阿里云", value: "ALIYUN" },
    { label: "腾讯云", value: "TENCENT" },
    { label: "华为云", value: "HUAWEI" },
    { label: "七牛云", value: "QINIU" },
    { label: "调试", value: "DEBUG" },
  ],
  [DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE]: [
    { label: "验证码", value: 1 },
    { label: "通知", value: 2 },
    { label: "营销", value: 3 },
  ],
  [DICT_TYPE.SYSTEM_SMS_SEND_STATUS]: [
    { label: "初始化", value: 0 },
    { label: "发送成功", value: 10, color: "success" },
    { label: "发送失败", value: 20, color: "error" },
    { label: "不发送", value: 30 },
  ],
  [DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS]: [
    { label: "等待结果", value: 0 },
    { label: "接收成功", value: 10, color: "success" },
    { label: "接收失败", value: 20, color: "error" },
  ],
  [DICT_TYPE.SYSTEM_OAUTH2_GRANT_TYPE]: [
    { label: "密码模式", value: "password" },
    { label: "授权码模式", value: "authorization_code" },
    { label: "简化模式", value: "implicit" },
    { label: "客户端模式", value: "client_credentials" },
    { label: "刷新模式", value: "refresh_token" },
  ],
  [DICT_TYPE.SYSTEM_MAIL_SEND_STATUS]: [
    { label: "初始化", value: 0 },
    { label: "发送成功", value: 10, color: "success" },
    { label: "发送失败", value: 20, color: "error" },
    { label: "不发送", value: 30 },
  ],
  [DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE]: [
    { label: "通知", value: 1 },
    { label: "公告", value: 2 },
  ],
  [DICT_TYPE.SYSTEM_SOCIAL_TYPE]: [
    { label: "Gitee", value: 10 },
    { label: "钉钉", value: 20 },
    { label: "企业微信", value: 30 },
    { label: "微信公众号", value: 31 },
    { label: "微信小程序", value: 32 },
    { label: "微信开放平台", value: 34 },
    { label: "支付宝", value: 40 },
  ],
  [DICT_TYPE.INFRA_BOOLEAN_STRING]: [
    { label: "是", value: true, color: "success" },
    { label: "否", value: false },
  ],
  /** NestJS 定时任务：0 停用 / 1 启用 */
  [DICT_TYPE.INFRA_JOB_STATUS]: [
    { label: "停用", value: 0, color: "error" },
    { label: "启用", value: 1, color: "success" },
  ],
  /** NestJS 任务日志：0 成功 / 1 失败 */
  [DICT_TYPE.INFRA_JOB_LOG_STATUS]: [
    { label: "成功", value: 0, color: "success" },
    { label: "失败", value: 1, color: "error" },
  ],
  [DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS]: [
    { label: "未处理", value: 0 },
    { label: "已处理", value: 1, color: "success" },
    { label: "已忽略", value: 2 },
  ],
  [DICT_TYPE.INFRA_CONFIG_TYPE]: [
    { label: "系统内置", value: 1 },
    { label: "自定义", value: 2 },
  ],
};

let serverDictMap: Record<string, DictOption[]> = {};

export function setServerDictMap(map: Record<string, DictOption[]>) {
  serverDictMap = map || {};
}

export function getIntDictOptions(dictType: string): DictOption[] {
  return serverDictMap[dictType] || STATIC_DICT[dictType] || [];
}

export function getStrDictOptions(dictType: string): DictOption[] {
  return getIntDictOptions(dictType).map((item) => ({
    ...item,
    value: String(item.value),
  }));
}

export function getBoolDictOptions(dictType: string): DictOption[] {
  return getIntDictOptions(dictType).map((item) => ({
    ...item,
    value: item.value === true || item.value === "true",
  }));
}

export function getDictLabel(dictType: string, value: any): string {
  const hit = getIntDictOptions(dictType).find(
    (item) => String(item.value) === String(value),
  );
  return hit?.label ?? (value == null || value === "" ? "-" : String(value));
}

export function getDictColor(dictType: string, value: any): string | undefined {
  return getIntDictOptions(dictType).find(
    (item) => String(item.value) === String(value),
  )?.color;
}

/** 从 `{name}` 模板内容提取参数名 */
export function extractTemplateParams(content?: string): string[] {
  if (!content) return [];
  const names = [...content.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  return [...new Set(names)];
}
