/**
 * 短信渠道 HTTP 客户端
 *
 * 纯函数/类实现，不做任何 NestJS 依赖注入，方便单元测试与独立复用。
 *
 * 职责：
 *  1. sendSms(channel, params)：按 channel.code（ALIYUN/TENCENT/HUAWEI/QINIU）
 *     分发到各厂商 HTTP API 完成真实发送，网络/HTTP 异常统一包装为
 *     { success:false, apiSendCode, apiSendMsg } 返回，绝不向上抛出；
 *  2. parse*ReceiveStatus(body)：解析各厂商推送的状态回调体，返回统一的
 *     接收结果条目列表，供 smsCallback.service 写回 sys_sms_log。
 *
 * 注意：本文件不引入任何 @nestjs/* 依赖；短信日志枚举（0/10/20）也在此统一
 * 声明，发送链路与回调链路共用，避免出现魔法数字。
 */
import axios from 'axios';
import {
  createHash,
  createHmac,
  randomUUID,
} from 'node:crypto';

/** HTTP 请求超时时间：10 秒（所有厂商统一） */
const HTTP_TIMEOUT = 10_000;

// ─── 短信日志状态枚举（写回 sys_sms_log） ────────────────────────────

/**
 * 短信发送状态枚举（对应 send_status 列）
 */
export const SmsSendStatusEnum = {
  /** 发送状态：初始化（已落库待发送） */
  INIT: 0,
  /** 发送状态：成功（厂商已受理） */
  SUCCESS: 10,
  /** 发送状态：失败 */
  FAILURE: 20,
} as const;

/**
 * 短信接收状态枚举（对应 receive_status 列）
 */
export const SmsReceiveStatusEnum = {
  /** 接收状态：未知（尚未收到状态报告） */
  UNKNOWN: 0,
  /** 接收状态：成功（用户已接收） */
  SUCCESS: 10,
  /** 接收状态：失败 */
  FAILURE: 20,
} as const;

// ─── 对外类型定义 ────────────────────────────────────────────────

/**
 * 渠道基本信息（由 sys_sms_channel 行映射而来，只取发送所需字段）
 */
export interface SmsChannelApi {
  /** 渠道编码：ALIYUN / TENCENT / HUAWEI / QINIU（大小写不敏感） */
  code: string;
  /** 短信签名：名称/内容。各厂商用法：阿里=SignName、腾讯=Sign、华为=signature（通用模板必填） */
  signature?: string;
  /**
   * 厂商账号 / 密钥前缀，各厂商约定：
   * - ALIYUN：AccessKeyId
   * - TENCENT：SecretId，与 SmsSdkAppId 按「SecretId SmsSdkAppId」空格拼接
   * - HUAWEI：app_key（短信应用 APP_Key）
   * - QINIU：AccessKey
   */
  apiKey?: string;
  /** 厂商密钥 / AccessKeySecret（各厂商含义同 apiKey 注释） */
  apiSecret?: string;
  /** 发送回调 URL（状态报告推送地址；缺省时部分厂商可空） */
  callbackUrl?: string;
}

/**
 * 发送短信参数（统一入参，由 smsTemplate.service 组装后调用）
 */
export interface SmsSendParams {
  /** 手机号：11 位大陆手机号（内部统一为裸号，由各厂商实现自行补国家码） */
  mobile: string;
  /** 厂商侧模板编号（对应 sys_sms_template.api_template_id，如阿里 SMS_123、腾讯 1400 开头模板 ID） */
  apiTemplateId: string;
  /** 模板参数键值对（阿里/七牛按对象透传，腾讯/华为需按下标顺序转为数组） */
  templateParams?: Record<string, any>;
  /** 模板参数键顺序（按模板内容 {param} 出现顺序，用于腾讯 TemplateParamSet / 华为 templateParas） */
  paramNames?: string[];
  /** 渲染后的短信正文（备用；部分厂商通用模板无需携带） */
  content?: string;
  /** 回调地址（缺省时回退到 channel.callbackUrl） */
  callbackUrl?: string;
  /**
   * 厂商扩展参数：渠道表未提供但厂商侧必须的标识，由调用方按需透传，
   * 例如：sdkAppId（腾讯，apiKey 未拼接时）、from（华为短信通道号）、
   * signatureId（七牛签名 ID）、region（腾讯/华为地域）。
   */
  extra?: Record<string, any>;
}

/**
 * 发送短信的统一结果
 */
export interface SmsSendResult {
  /** 是否发送成功（HTTP 2xx 且厂商业务码为成功） */
  success: boolean;
  /** 厂商返回的业务编码（成功如 OK/000000；失败为厂商错误码或网络错误码） */
  apiSendCode: string;
  /** 厂商返回的提示信息（失败原因/网络错误描述） */
  apiSendMsg: string;
  /** 厂商返回的唯一请求 ID（用于与厂商平台定位排错） */
  apiRequestId?: string;
  /** 厂商返回的发送序号/业务 ID（回调匹配键，写回 api_serial_no） */
  apiSerialNo?: string;
}

/**
 * 解析出的单条接收状态（由 parse*ReceiveStatus 产出）
 */
export interface SmsReceiveStatusItem {
  /** 厂商发送序号/回执 ID（写回 api_serial_no，用于精确匹配） */
  apiSerialNo?: string;
  /** 手机号（已清洗为 11 位裸号，清洗失败时保留原值） */
  mobile?: string;
  /** 厂商接收结果编码（如 DELIVRD / DELIVERED / SUCCESS / FAIL 等） */
  apiReceiveCode: string;
  /** 厂商接收结果描述 */
  apiReceiveMsg?: string;
  /** 接收时间（厂商原始字符串，交由 parseProviderTime 转 Date） */
  receiveTime?: string;
  /** 是否接收成功 */
  success: boolean;
}

// ─── 通用小工具 ──────────────────────────────────────────────────

/** sha256 十六进制小写摘要 */
function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/** hmac-sha256 十六进制小写 */
function hmacSha256Hex(key: string, content: string): string {
  return createHmac('sha256', key).update(content, 'utf8').digest('hex');
}

/** hmac-sha1 原始字节（Qiniu 用） */
function hmacSha1(key: string, content: string): Buffer {
  return createHmac('sha1', key).update(content, 'utf8').digest();
}

/** Base64 的 URL 安全编码（去掉 =、+→-、/→_） */
function base64UrlSafe(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * RFC 3986 编码（与 Java URLEncoder 对齐：空格→%20、*→%2A、保留 ~）
 * 阿里云 ACS3 签名与腾讯 TC3 的 canonical 均使用该编码规则。
 */
function percentEncode(text: string): string {
  return encodeURIComponent(text).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/** 按 RFC 3986 规则编码的规范化查询串（key 升序、值编码） */
function buildCanonicalQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');
}

/**
 * 统一把任意异常转成「厂商错误码 + 错误消息」，用于网络/超时/HTTP 状态错误等
 * 场景（调用方约定：一律不抛出，只返回 { success:false } 结果）。
 */
function extractError(err: unknown): { code: string; msg: string } {
  if (axios.isAxiosError(err)) {
    const data: any = err.response?.data;
    // 有响应体时优先取厂商业务错误（各厂商命名不一致，做兼容）
    const code =
      data?.Code ?? data?.code ?? data?.Error?.Code ?? data?.errCode ?? data?.errcode;
    const msg =
      data?.Message ?? data?.message ?? data?.Error?.Message ?? data?.msg ?? data?.errmsg;
    if (code !== undefined && code !== null && code !== '') {
      return { code: String(code), msg: msg ? String(msg) : err.message };
    }
    // 无响应体（网络不通/超时/连接被拒等）：错误码用 HTTP 状态或 axios 错误码
    return {
      code: String(err.response?.status ?? err.code ?? 'UNKNOWN'),
      msg: err.message,
    };
  }
  return {
    code: 'UNKNOWN',
    msg: err instanceof Error ? err.message : String(err),
  };
}

/**
 * 手机号清洗：去掉 +86 / 0086 / 86 前缀，尽量规整为 11 位大陆手机号；
 * 无法规整时原样返回（交由调用方判断），避免误伤国际号码格式。
 */
export function normalizeMobile(raw?: string | number): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const text = String(raw).trim();
  if (!text) return undefined;
  let digits = text.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
  // 兼容 "86" 前缀：8613800138000(13位) → 去掉前两位
  if (digits.startsWith('86') && digits.length === 13) {
    digits = digits.slice(2);
  }
  return /^1\d{10}$/.test(digits) ? digits : text;
}

/**
 * 厂商回执时间 → Date。兼容常见格式：
 * ISO8601（2026-09-04T08:00:00Z）、yyyy-MM-dd HH:mm:ss、yyyyMMddHHmmssZ 等，
 * 解析失败返回 undefined（调用方兜底使用当前时间）。
 */
export function parseProviderTime(raw?: string | number): Date | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const text = String(raw).trim();
  if (!text) return undefined;
  // 华为云：UTC 紧凑格式 yyyyMMddHHmmssZ
  const huaweiCompact = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z?$/.exec(text);
  if (huaweiCompact) {
    const [, y, m, d, h, min, s] = huaweiCompact;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)));
    return isNaN(date.getTime()) ? undefined : date;
  }
  // 数字时间戳
  if (/^\d{10,13}$/.test(text)) {
    const ts = Number(text.length === 13 ? text : text + '000');
    const date = new Date(ts);
    return isNaN(date.getTime()) ? undefined : date;
  }
  // 其余（ISO8601 / 形如 yyyy-MM-dd HH:mm:ss 的本地时间）交给 Date 解析
  const date = new Date(text.includes('T') ? text : text.replace(' ', 'T'));
  return isNaN(date.getTime()) ? undefined : date;
}

/** 将字符串按 urlencoded 解析为对象（华为云回调为 x-www-form-urlencoded） */
function parseFormString(raw: string): Record<string, any> {
  const result: Record<string, any> = {};
  const pairs = raw.split('&');
  for (const pair of pairs) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    if (idx === -1) {
      result[decodeURIComponent(pair)] = '';
      continue;
    }
    const key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '));
    const value = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
    result[key] = value;
  }
  return result;
}

/**
 * 统一把回调体（可能是对象/数组/JSON 字符串/urlencoded 字符串）规整为对象数组。
 * 同时兼容 {"data":[...]} / {"items":[...]} 等包裹结构。
 */
function extractItems(body: unknown): any[] {
  let obj: any = body;
  if (typeof obj === 'string') {
    const text = obj.trim();
    if (!text) return [];
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        obj = JSON.parse(text);
      } catch {
        // 非 JSON：按 urlencoded 表单解析（华为云回调）
        obj = parseFormString(text);
      }
    } else {
      obj = parseFormString(text);
    }
  }
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === 'object') {
    for (const key of ['data', 'items', 'list', 'records', 'result']) {
      if (Array.isArray(obj[key])) return obj[key];
    }
    // 单条状态对象
    return [obj];
  }
  return [];
}

/** 从对象中按候选 key 取第一个存在的值（兼容各厂商字段命名差异） */
function firstOf(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/** 判断回执状态文本是否为「接收成功」（各厂商用词不一，统一比对） */
function isSuccessStatus(status?: string): boolean {
  if (status === undefined || status === null) return false;
  const text = String(status).trim().toUpperCase();
  return ['SUCCESS', 'DELIVRD', 'DELIVERED', 'OK', 'SENT', 'ACCEPTD', 'RECEIVED_DUPLICATE'].includes(text);
}

/** 判断回执状态文本是否为「接收失败」（仅兜底，无法识别时按失败处理避免误判成功） */
function isFailStatus(status?: string): boolean {
  if (status === undefined || status === null) return false;
  const text = String(status).trim().toUpperCase();
  return ['FAIL', 'FAILED', 'UNDELIV', 'UNDELIVERED', 'ERROR', 'REJECT', 'REJECTED', 'EXPIRED', 'DELETED'].includes(text);
}

// ─── 各厂商发送实现 ────────────────────────────────────────────────

/**
 * 阿里云短信发送
 *
 * 端点：POST https://dysmsapi.aliyuncs.com/ （RPC 风格，业务参数放规范化 Query）
 * 签名：ACS3-HMAC-SHA256，Signature = HexEncode(HMAC-SHA256(AccessKeySecret, StringToSign))
 *   文档：https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature
 *   短信 API：https://help.aliyun.com/zh/sms/developer-reference/api-dysmsapi-20170525-sendsms
 */
async function sendByAliyun(channel: SmsChannelApi, params: SmsSendParams): Promise<SmsSendResult> {
  try {
    const endpoint = 'dysmsapi.aliyuncs.com';
    const xAcsDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const contentSha256 = sha256Hex(''); // 本实现业务参数全部走 Query，无请求体
    const signNonce = randomUUID();

    // RPC 业务参数（手机号/签名/模板/模板参数 JSON）
    const queryParams: Record<string, string> = {
      PhoneNumbers: params.mobile,
      SignName: channel.signature ?? '',
      TemplateCode: params.apiTemplateId,
      TemplateParam: JSON.stringify(params.templateParams ?? {}),
    };

    // 构造规范化请求与待签名字符串
    const canonicalHeaders = [
      `host:${endpoint}\n`,
      `x-acs-action:SendSms\n`,
      `x-acs-content-sha256:${contentSha256}\n`,
      `x-acs-date:${xAcsDate}\n`,
      `x-acs-signature-nonce:${signNonce}\n`,
      `x-acs-version:2017-05-25\n`,
    ].join('');
    const signedHeaders = 'host;x-acs-action;x-acs-content-sha256;x-acs-date;x-acs-signature-nonce;x-acs-version';
    const canonicalRequest = [
      'POST',
      '/',
      buildCanonicalQuery(queryParams),
      canonicalHeaders,
      signedHeaders,
      contentSha256,
    ].join('\n');
    const stringToSign = `ACS3-HMAC-SHA256\n${sha256Hex(canonicalRequest)}`;
    const signature = hmacSha256Hex(channel.apiSecret ?? '', stringToSign);

    const url = `https://${endpoint}/?${buildCanonicalQuery(queryParams)}`;
    const response = await axios.request({
      method: 'POST',
      url,
      timeout: HTTP_TIMEOUT,
      headers: {
        'x-acs-action': 'SendSms',
        'x-acs-version': '2017-05-25',
        'x-acs-date': xAcsDate,
        'x-acs-content-sha256': contentSha256,
        'x-acs-signature-nonce': signNonce,
        Authorization: `ACS3-HMAC-SHA256 Credential=${channel.apiKey ?? ''},SignedHeaders=${signedHeaders},Signature=${signature}`,
      },
      // 无请求体（业务参数在 URL Query 中），content-sha256 对空串取摘要
      data: undefined,
      maxRedirects: 0,
    });

    const data: any = response.data ?? {};
    const code = data.Code ?? data.code ?? 'UNKNOWN';
    const ok = code === 'OK';
    return {
      success: ok,
      apiSendCode: String(code),
      apiSendMsg: data.Message ?? data.message ?? '',
      apiRequestId: data.RequestId ?? undefined,
      apiSerialNo: data.BizId ? String(data.BizId) : undefined,
    };
  } catch (err) {
    const { code, msg } = extractError(err);
    return { success: false, apiSendCode: code, apiSendMsg: msg };
  }
}

/**
 * 腾讯云短信发送（云 API 3.0 / TC3-HMAC-SHA256）
 *
 * 端点：POST https://sms.tencentcloudapi.com/  json
 * 签名：TC3-HMAC-SHA256（标准腾讯云 TC3 流程，service 固定为 sms）
 *   文档：https://cloud.tencent.com/document/api/382/55981
 *   回调：https://cloud.tencent.com/document/product/382/59178
 * 约定：渠道 apiKey 填「SecretId SmsSdkAppId」（空格分隔，2 段）；
 *       若只填 SecretId，则 SmsSdkAppId 需通过 params.extra.sdkAppId 透传。
 */
async function sendByTencent(channel: SmsChannelApi, params: SmsSendParams): Promise<SmsSendResult> {
  try {
    const host = 'sms.tencentcloudapi.com';
    const service = 'sms';
    const version = '2021-01-11';
    const action = 'SendSms';
    // 解析 SecretId / SmsSdkAppId
    const keyParts = (channel.apiKey ?? '').trim().split(/\s+/);
    const secretId = keyParts[0] ?? '';
    const sdkAppId = keyParts.length >= 2 ? keyParts.slice(1).join('') : (params.extra?.sdkAppId ?? '');

    // 模板参数按下标顺序转为数组（对应模板内容 {1}{2} 占位顺序）
    const paramSet = (params.paramNames ?? []).map((name) => {
      const value = params.templateParams?.[name];
      return value === undefined || value === null ? '' : String(value);
    });

    const payload = {
      PhoneNumberSet: [`+86${params.mobile}`],
      SmsSdkAppId: sdkAppId,
      Sign: channel.signature ?? '',
      TemplateId: params.apiTemplateId,
      TemplateParamSet: paramSet,
      SessionContext: '',
    };
    const payloadStr = JSON.stringify(payload);

    // TC3 签名流程
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10); // yyyy-MM-dd（UTC）
    const contentType = 'application/json; charset=utf-8';

    const canonicalRequest = [
      'POST',
      '/',
      '',
      `content-type:${contentType}\nhost:${host}\n`,
      'content-type;host',
      sha256Hex(payloadStr),
    ].join('\n');
    const stringToSign = [
      'TC3-HMAC-SHA256',
      String(timestamp),
      `${date}/${service}/tc3_request`,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const secretDate = createHmac('sha256', `TC3${channel.apiSecret ?? ''}`)
      .update(date, 'utf8').digest();
    const secretService = createHmac('sha256', secretDate)
      .update(service, 'utf8').digest();
    const secretSigning = createHmac('sha256', secretService)
      .update('tc3_request', 'utf8').digest();
    const signature = createHmac('sha256', secretSigning)
      .update(stringToSign, 'utf8').digest('hex');

    const response = await axios.request({
      method: 'POST',
      url: `https://${host}/`,
      timeout: HTTP_TIMEOUT,
      headers: {
        'Content-Type': contentType,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Timestamp': String(timestamp),
        Authorization: `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`,
      },
      data: payloadStr,
    });

    const data: any = response.data ?? {};
    const resp: any = data.Response ?? {};
    const firstStatus: any = Array.isArray(resp.SendStatusSet) ? resp.SendStatusSet[0] : undefined;
    // 顶层 Error 存在 = 请求失败；否则看单条发送状态 Code（Ok 为成功）
    const topError: any = resp.Error;
    const perCode: string = firstStatus?.Code ?? 'Ok';
    const ok = !topError && String(perCode) === 'Ok';
    return {
      success: ok,
      apiSendCode: topError ? String(topError.Code) : String(perCode),
      apiSendMsg: topError ? (topError.Message ?? '') : (firstStatus?.Message ?? ''),
      apiRequestId: resp.RequestId ?? undefined,
      apiSerialNo: firstStatus?.SerialNo ? String(firstStatus.SerialNo) : undefined,
    };
  } catch (err) {
    const { code, msg } = extractError(err);
    return { success: false, apiSendCode: code, apiSendMsg: msg };
  }
}

/**
 * 华为云短信发送（X-WSSE 认证）
 *
 * 端点：POST https://smsapi.cn-north-4.myhuaweicloud.com:443/sms/batchSendSms/v1
 * 认证：X-WSSE = UsernameToken（appKey/appSecret），
 *       PasswordDigest = Base64(SHA256(Nonce + Created + appSecret))
 *   发送文档：https://support.huaweicloud.com/api-msgsms/sms_05_0001.html
 *   回调文档：https://support.huaweicloud.com/api-msgsms/sms_05_0003.html
 * 注意：短信通道号（from）渠道表无对应列，需通过 params.extra.from 透传，
 *       缺失时华为云会返回错误码并如实写回日志。
 */
async function sendByHuawei(channel: SmsChannelApi, params: SmsSendParams): Promise<SmsSendResult> {
  try {
    const host = 'smsapi.cn-north-4.myhuaweicloud.com';
    const appKey = channel.apiKey ?? '';
    const appSecret = channel.apiSecret ?? '';
    // X-WSSE：Nonce 随机串 + Created UTC 时间 + PasswordDigest
    const nonce = randomUUID().replace(/-/g, '');
    const created = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const passwordDigest = Buffer.from(
      sha256Hex(nonce + created + appSecret),
      'utf8',
    ).toString('base64');

    // 模板参数按下标顺序转为 JSON 数组字符串（华为模板占位 {1}{2}）
    const paramValues = (params.paramNames ?? []).map((name) => {
      const value = params.templateParams?.[name];
      return value === undefined || value === null ? '' : String(value);
    });
    const formData = new URLSearchParams();
    formData.append('from', params.extra?.from ?? ''); // 短信通道号
    formData.append('to', `+86${params.mobile}`);
    formData.append('templateId', params.apiTemplateId);
    formData.append('templateParas', JSON.stringify(paramValues));
    if (channel.signature) {
      formData.append('signature', channel.signature); // 通用模板必填（签名名称）
    }
    const callbackUrl = params.callbackUrl ?? channel.callbackUrl;
    if (callbackUrl) {
      formData.append('statusCallback', callbackUrl);
    }

    const response = await axios.request({
      method: 'POST',
      url: `https://${host}:443/sms/batchSendSms/v1`,
      timeout: HTTP_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'WSSE realm="SDP",profile="UsernameToken",type="Appkey"',
        'X-WSSE': `UsernameToken Username="${appKey}",PasswordDigest="${passwordDigest}",Nonce="${nonce}",Created="${created}"`,
      },
      data: formData.toString(),
    });

    const data: any = response.data ?? {};
    const code = data.code ?? data.Code ?? 'UNKNOWN';
    const firstResult: any = Array.isArray(data.result) ? data.result[0] : undefined;
    return {
      success: String(code) === '000000',
      apiSendCode: String(code),
      apiSendMsg: data.description ?? data.Description ?? '',
      apiSerialNo: firstResult?.smsMsgId ? String(firstResult.smsMsgId) : undefined,
    };
  } catch (err) {
    const { code, msg } = extractError(err);
    return { success: false, apiSendCode: code, apiSendMsg: msg };
  }
}

/**
 * 七牛云短信发送
 *
 * 端点：POST https://sms.qiniuapi.com/v1/message  json
 * 认证：Authorization: Qiniu <AccessKey>:<urlsafeBase64(hmac-sha1(SK, 待签串))>
 *   发送文档：https://developer.qiniu.com/sms/5906/message-push（status 回调）
 *   管理凭证签名：https://developer.qiniu.com/kodo/.../access-token（Qiniu 请求签名）
 * 注意：七牛模板/签名使用数字 ID，签名 ID（signature_id）渠道表无对应列，
 *       需通过 params.extra.signatureId 透传；缺失时交由七牛侧报错并写回日志。
 */
async function sendByQiniu(channel: SmsChannelApi, params: SmsSendParams): Promise<SmsSendResult> {
  try {
    const host = 'sms.qiniuapi.com';
    const path = '/v1/message';
    const accessKey = channel.apiKey ?? '';
    const secretKey = channel.apiSecret ?? '';
    const contentType = 'application/json';

    const bodyObj: Record<string, any> = {
      template_id: params.apiTemplateId,
      mobiles: [params.mobile],
      parameters: params.templateParams ?? {},
    };
    // 七牛签名 ID（渠道表未提供，需 extra 透传）
    const signatureId = params.extra?.signatureId;
    if (signatureId) {
      bodyObj.signature_id = String(signatureId);
    }
    const bodyStr = JSON.stringify(bodyObj);

    // Qiniu 待签串：<Method> <Path>\nHost: <Host>\nContent-Type: <ContentType>\n\n<Body>
    const signingStr = [
      `POST ${path}`,
      `Host: ${host}`,
      `Content-Type: ${contentType}`,
      '',
      bodyStr,
    ].join('\n');
    const signature = base64UrlSafe(hmacSha1(secretKey, signingStr));

    const response = await axios.request({
      method: 'POST',
      url: `https://${host}${path}`,
      timeout: HTTP_TIMEOUT,
      headers: {
        'Content-Type': contentType,
        Authorization: `Qiniu ${accessKey}:${signature}`,
      },
      data: bodyStr,
    });

    const data: any = response.data ?? {};
    // 七牛 v1/message 成功时通常无业务错误字段，此处兼容 { code } / 无字段两种形态
    const bizCode = data?.code ?? data?.Code;
    const ok = bizCode === undefined || String(bizCode) === '0' || String(bizCode) === 'OK';
    return {
      success: ok,
      apiSendCode: ok ? 'OK' : String(bizCode),
      apiSendMsg: ok ? '成功' : (data?.message ?? data?.error ?? data?.Message ?? ''),
      apiRequestId: (data?.request_id ?? data?.requestId ?? data?.id) ? String(data?.request_id ?? data?.requestId ?? data?.id) : undefined,
      apiSerialNo: (data?.job_id ?? data?.message_id) ? String(data?.job_id ?? data?.message_id) : undefined,
    };
  } catch (err) {
    const { code, msg } = extractError(err);
    return { success: false, apiSendCode: code, apiSendMsg: msg };
  }
}

/**
 * 按模板发送短信（统一入口）
 *
 * 按 channel.code 分发到具体厂商实现；网络/HTTP/业务异常均不抛出，
 * 统一返回 {@link SmsSendResult}（success=false + apiSendCode/apiSendMsg）。
 */
export async function sendSms(
  channel: SmsChannelApi,
  params: SmsSendParams,
): Promise<SmsSendResult> {
  const code = (channel.code ?? '').trim().toUpperCase();
  switch (code) {
    case 'ALIYUN':
      return sendByAliyun(channel, params);
    case 'TENCENT':
      return sendByTencent(channel, params);
    case 'HUAWEI':
      return sendByHuawei(channel, params);
    case 'QINIU':
      return sendByQiniu(channel, params);
    default:
      return {
        success: false,
        apiSendCode: 'UNSUPPORTED_CHANNEL',
        apiSendMsg: `不支持的短信渠道编码：${code || '(空)'}`,
      };
  }
}

// ─── 各厂商接收状态回调解析 ─────────────────────────────────────────

/**
 * 阿里云短信状态回执解析（SmsReport 接口）
 *
 * 回调体：JSON 数组，常见字段：
 *   phone_number 手机号；success 是否成功；err_code（DELIVERED=成功）；
 *   err_msg 错误描述；report_time 回执时间；biz_id 回执 ID（对应发送返回的 BizId）；
 *   out_id 调用方自定义 ID。
 * 文档：https://help.aliyun.com/zh/sms/developer-reference/smsreport-http
 */
export function parseAliyunReceiveStatus(body: unknown): SmsReceiveStatusItem[] {
  return extractItems(body)
    .filter((it) => it && typeof it === 'object')
    .map((it) => {
      const success = it.success === true || it.success === 'true' || it.success === 1;
      const rawCode = it.err_code ?? it.errCode;
      const rawMsg = it.err_msg ?? it.errMsg;
      const rawTime = it.report_time ?? it.reportTime ?? it.send_time;
      return {
        apiSerialNo: it.biz_id ?? it.bizId ? String(it.biz_id ?? it.bizId) : undefined,
        mobile: normalizeMobile(it.phone_number ?? it.phoneNumber ?? it.mobile),
        apiReceiveCode: rawCode !== undefined && rawCode !== null
          ? String(rawCode)
          : success ? 'DELIVERED' : 'FAILED',
        apiReceiveMsg: rawMsg !== undefined && rawMsg !== null ? String(rawMsg) : undefined,
        receiveTime: rawTime !== undefined && rawTime !== null ? String(rawTime) : undefined,
        success,
      };
    });
}

/**
 * 腾讯云短信状态回执解析
 *
 * 回调体：JSON 数组，常见字段：
 *   mobile 手机号；nationcode 国家码；sid 发送序号（对应发送响应 SerialNo）；
 *   report_status（SUCCESS/FAIL）；errmsg（如 DELIVRD）；description 失败描述；
 *   user_receive_time 接收时间。
 * 文档：https://cloud.tencent.com/document/product/382/59178
 */
export function parseTencentReceiveStatus(body: unknown): SmsReceiveStatusItem[] {
  return extractItems(body)
    .filter((it) => it && typeof it === 'object')
    .map((it) => {
      const reportStatus = it.report_status ?? it.reportStatus;
      const rawStatus = String(reportStatus ?? it.status ?? '').toUpperCase();
      const errmsg = it.errmsg ?? it.errMsg;
      const description = it.description ?? it.desc;
      const success = rawStatus === 'SUCCESS' || isSuccessStatus(rawStatus);
      // 腾讯 mobile 常不含国家码，nationcode 单独给出；缺失时保持原值交 normalizeMobile 清洗
      const nationcode = it.nationcode ?? it.nationCode;
      const nationText = nationcode !== undefined && nationcode !== null ? String(nationcode) : '';
      const mobileRaw = it.mobile !== undefined && it.mobile !== null
        ? (nationText && !nationText.startsWith('86') ? nationText + it.mobile : it.mobile)
        : it.mobile;
      // 序号与时间取首个可用字段
      const serialRaw = it.sid ?? it.serialNo;
      const timeRaw = it.user_receive_time ?? it.userReceiveTime;
      // 描述优先，其次 errmsg
      const receiveMsg = description !== undefined && description !== null
        ? String(description)
        : errmsg !== undefined && errmsg !== null
          ? String(errmsg)
          : undefined;
      return {
        apiSerialNo: serialRaw !== undefined && serialRaw !== null && serialRaw !== ''
          ? String(serialRaw)
          : undefined,
        mobile: normalizeMobile(mobileRaw),
        apiReceiveCode: rawStatus || (success ? 'SUCCESS' : 'FAIL'),
        apiReceiveMsg: receiveMsg,
        receiveTime: timeRaw !== undefined && timeRaw !== null && timeRaw !== ''
          ? String(timeRaw)
          : undefined,
        success,
      };
    });
}

/**
 * 华为云短信状态回执解析
 *
 * 华为以 application/x-www-form-urlencoded 推送（body 可能已被解析为对象，
 * 也可能仍为原始表单字符串）。常见字段：
 *   smsMsgId 短信唯一标识（必填）；status（DELIVRD=成功，EXPIRED/DELETED/UNDELIV=失败）；
 *   statusDesc 状态描述；to 接收号码（带 +86）；updateTime 更新时间（UTC ISO）；
 *   extend 扩展字段；sequence 序号。
 * 文档：https://support.huaweicloud.com/api-msgsms/sms_05_0003.html
 */
export function parseHuaweiReceiveStatus(body: unknown): SmsReceiveStatusItem[] {
  return extractItems(body)
    .filter((it) => it && typeof it === 'object')
    .map((it) => {
      const rawStatus = String(it.status ?? '').toUpperCase();
      const success = rawStatus === 'DELIVRD';
      const statusDesc = it.statusDesc ?? it.status_desc;
      const updateTime = it.updateTime ?? it.update_time;
      return {
        apiSerialNo: it.smsMsgId !== undefined && it.smsMsgId !== null && it.smsMsgId !== ''
          ? String(it.smsMsgId)
          : undefined,
        mobile: normalizeMobile(it.to ?? it.mobile),
        apiReceiveCode: rawStatus || (success ? 'DELIVRD' : 'FAILED'),
        apiReceiveMsg: statusDesc !== undefined && statusDesc !== null
          ? String(statusDesc)
          : undefined,
        receiveTime: updateTime !== undefined && updateTime !== null && updateTime !== ''
          ? String(updateTime)
          : undefined,
        success,
      };
    });
}

/**
 * 七牛云短信状态回执解析（宽松兼容实现）
 *
 * 说明：七牛回调结构（字段名与包裹层级）未能从公开渠道完全确认，
 * 这里按常见形态做宽容解析：兼容数组 / {items:[]} / {data:[]} 等包裹，
 * 字段名做多候选兜底（mobile/phone/...、id/sid/message_id/...、status/report_status/...）。
 * 回调文档：https://developer.qiniu.com/sms/5910/message-push
 */
export function parseQiniuReceiveStatus(body: unknown): SmsReceiveStatusItem[] {
  return extractItems(body)
    .filter((it) => it && typeof it === 'object')
    .map((it) => {
      // 显式布尔字段优先（部分回调给出 success 布尔值）
      const successFlag = firstOf(it, ['success', 'is_success']);
      const statusCandidates = ['status', 'report_status', 'state', 'result_code', 'err_code'];
      const rawStatusValue = firstOf(it, statusCandidates);
      const rawStatus = rawStatusValue !== undefined ? String(rawStatusValue) : undefined;
      let success: boolean;
      if (successFlag === true || successFlag === 'true' || successFlag === 1) {
        success = true;
      } else if (successFlag === false || successFlag === 'false' || successFlag === 0) {
        success = false;
      } else if (isSuccessStatus(rawStatus)) {
        success = true;
      } else if (isFailStatus(rawStatus)) {
        success = false;
      } else {
        // 无任何状态可判：保守置为失败（避免误标成功），由 code=UNKNOWN 标识
        success = false;
      }
      const serialCandidates = ['message_id', 'messageId', 'msg_id', 'msgId', 'sid', 'biz_id', 'bizId', 'smsMsgId', 'job_id'];
      const timeCandidates = ['time', 'report_time', 'reportTime', 'update_time', 'updateTime', 'user_receive_time', 'receive_time', 'timestamp', 'created_at'];
      const serialRaw = firstOf(it, serialCandidates);
      const timeRaw = firstOf(it, timeCandidates);
      const rawMsg = firstOf(it, ['description', 'desc', 'errmsg', 'err_msg', 'message', 'msg', 'remark']);
      return {
        apiSerialNo: serialRaw !== undefined ? String(serialRaw) : undefined,
        mobile: normalizeMobile(firstOf(it, ['mobile', 'phone', 'phone_number', 'phoneNumber', 'to'])),
        apiReceiveCode: rawStatus ?? (success ? 'DELIVERED' : 'UNKNOWN'),
        apiReceiveMsg: rawMsg !== undefined ? String(rawMsg) : undefined,
        receiveTime: timeRaw !== undefined ? String(timeRaw) : undefined,
        success,
      };
    });
}
