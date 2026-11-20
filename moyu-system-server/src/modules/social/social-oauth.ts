import { HttpException, HttpStatus } from '@nestjs/common';
import { SocialError } from '@/config/error-messages';
import axios from 'axios';
import { SocialTypeEnum } from '@/config/constants';
import { SocialClientDO } from './socialClient/entities/socialClient.entity';

const HTTP_TIMEOUT = 10_000;

/** 授权码换取后的统一三方用户信息 */
export interface SocialOAuthProfile {
  openid: string;
  token: string;
  nickname: string;
  avatar: string;
  rawTokenInfo: string;
  rawUserInfo: string;
}

function isWeCom(type: number): boolean {
  return (
    type === SocialTypeEnum.WECHAT_ENTERPRISE ||
    type === SocialTypeEnum.WECHAT_ENTERPRISE_LEGACY
  );
}

function isDingTalk(type: number): boolean {
  return (
    type === SocialTypeEnum.DING_TALK ||
    type === SocialTypeEnum.DING_TALK_LEGACY
  );
}

/**
 * 构建三方授权跳转 URL
 */
export function buildSocialAuthorizeUrl(
  client: SocialClientDO,
  redirectUri: string,
  state: string,
): string {
  const encodedRedirect = encodeURIComponent(redirectUri);
  const encodedState = encodeURIComponent(state);
  const type = client.socialType;

  if (isWeCom(type)) {
    const agentId = client.agentId || '';
    return (
      `https://open.work.weixin.qq.com/wwopen/sso/qrConnect` +
      `?appid=${encodeURIComponent(client.clientId)}` +
      `&agentid=${encodeURIComponent(agentId)}` +
      `&redirect_uri=${encodedRedirect}` +
      `&state=${encodedState}`
    );
  }
  if (isDingTalk(type)) {
    return (
      `https://login.dingtalk.com/oauth2/auth` +
      `?client_id=${encodeURIComponent(client.clientId)}` +
      `&response_type=code` +
      `&scope=openid` +
      `&state=${encodedState}` +
      `&redirect_uri=${encodedRedirect}` +
      `&prompt=consent`
    );
  }
  if (type === SocialTypeEnum.WECHAT_OPEN) {
    return (
      `https://open.weixin.qq.com/connect/qrconnect` +
      `?appid=${encodeURIComponent(client.clientId)}` +
      `&redirect_uri=${encodedRedirect}` +
      `&response_type=code` +
      `&scope=snsapi_login` +
      `&state=${encodedState}` +
      `#wechat_redirect`
    );
  }
  if (
    type === SocialTypeEnum.WECHAT_MP ||
    type === SocialTypeEnum.WECHAT_MINI_PROGRAM
  ) {
    return (
      `https://open.weixin.qq.com/connect/oauth2/authorize` +
      `?appid=${encodeURIComponent(client.clientId)}` +
      `&redirect_uri=${encodedRedirect}` +
      `&response_type=code` +
      `&scope=snsapi_userinfo` +
      `&state=${encodedState}` +
      `#wechat_redirect`
    );
  }
  if (type === SocialTypeEnum.GITEE) {
    return (
      `https://gitee.com/oauth/authorize` +
      `?client_id=${encodeURIComponent(client.clientId)}` +
      `&redirect_uri=${encodedRedirect}` +
      `&response_type=code` +
      `&state=${encodedState}`
    );
  }
  throw new HttpException(
    `暂不支持的社交类型：${type}`,
    HttpStatus.BAD_REQUEST,
  );
}

/**
 * 用授权码换取三方用户资料
 */
export async function exchangeSocialCode(
  client: SocialClientDO,
  code: string,
  redirectUri?: string,
): Promise<SocialOAuthProfile> {
  const type = client.socialType;
  if (isWeCom(type)) {
    return exchangeWeCom(client, code);
  }
  if (isDingTalk(type)) {
    return exchangeDingTalk(client, code);
  }
  if (
    type === SocialTypeEnum.WECHAT_OPEN ||
    type === SocialTypeEnum.WECHAT_MP ||
    type === SocialTypeEnum.WECHAT_MINI_PROGRAM
  ) {
    return exchangeWeChatOpen(client, code);
  }
  if (type === SocialTypeEnum.GITEE) {
    return exchangeGitee(client, code, redirectUri);
  }
  throw new HttpException(
    `暂不支持的社交类型：${type}`,
    HttpStatus.BAD_REQUEST,
  );
}

async function exchangeWeCom(
  client: SocialClientDO,
  code: string,
): Promise<SocialOAuthProfile> {
  const tokenResp = await axios.get(
    'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
    {
      params: { corpid: client.clientId, corpsecret: client.clientSecret },
      timeout: HTTP_TIMEOUT,
    },
  );
  const accessToken = tokenResp.data?.access_token as string | undefined;
  if (!accessToken) {
    throw new HttpException(
      `企业微信获取 access_token 失败：${tokenResp.data?.errmsg || '未知错误'}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  const userResp = await axios.get(
    'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo',
    {
      params: { access_token: accessToken, code },
      timeout: HTTP_TIMEOUT,
    },
  );
  const openid =
    (userResp.data?.UserId as string) ||
    (userResp.data?.OpenId as string) ||
    '';
  if (!openid) {
    throw new HttpException(
      `企业微信换取用户失败：${userResp.data?.errmsg || '无效授权码'}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return {
    openid,
    token: accessToken,
    nickname: openid,
    avatar: '',
    rawTokenInfo: JSON.stringify(tokenResp.data ?? {}),
    rawUserInfo: JSON.stringify(userResp.data ?? {}),
  };
}

async function exchangeDingTalk(
  client: SocialClientDO,
  code: string,
): Promise<SocialOAuthProfile> {
  const tokenResp = await axios.post(
    'https://api.dingtalk.com/v1.0/oauth2/userAccessToken',
    {
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      code,
      grantType: 'authorization_code',
    },
    { timeout: HTTP_TIMEOUT },
  );
  const accessToken = tokenResp.data?.accessToken as string | undefined;
  if (!accessToken) {
    throw new HttpException(
      `钉钉换取 accessToken 失败：${JSON.stringify(tokenResp.data ?? {})}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  const userResp = await axios.get(
    'https://api.dingtalk.com/v1.0/contact/users/me',
    {
      headers: { 'x-acs-dingtalk-access-token': accessToken },
      timeout: HTTP_TIMEOUT,
    },
  );
  const openid =
    (userResp.data?.openId as string) ||
    (userResp.data?.unionId as string) ||
    '';
  if (!openid) {
    throw new HttpException(SocialError.DINGTALK_OPENID_MISSING, HttpStatus.BAD_REQUEST);
  }
  return {
    openid,
    token: accessToken,
    nickname: (userResp.data?.nick as string) || openid,
    avatar: (userResp.data?.avatarUrl as string) || '',
    rawTokenInfo: JSON.stringify(tokenResp.data ?? {}),
    rawUserInfo: JSON.stringify(userResp.data ?? {}),
  };
}

async function exchangeWeChatOpen(
  client: SocialClientDO,
  code: string,
): Promise<SocialOAuthProfile> {
  const tokenResp = await axios.get(
    'https://api.weixin.qq.com/sns/oauth2/access_token',
    {
      params: {
        appid: client.clientId,
        secret: client.clientSecret,
        code,
        grant_type: 'authorization_code',
      },
      timeout: HTTP_TIMEOUT,
    },
  );
  const accessToken = tokenResp.data?.access_token as string | undefined;
  const openid = tokenResp.data?.openid as string | undefined;
  if (!accessToken || !openid) {
    throw new HttpException(
      `微信换取 access_token 失败：${tokenResp.data?.errmsg || '无效授权码'}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  let nickname = openid;
  let avatar = '';
  let rawUserInfo = '{}';
  try {
    const userResp = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: { access_token: accessToken, openid, lang: 'zh_CN' },
      timeout: HTTP_TIMEOUT,
    });
    nickname = (userResp.data?.nickname as string) || openid;
    avatar = (userResp.data?.headimgurl as string) || '';
    rawUserInfo = JSON.stringify(userResp.data ?? {});
  } catch {
    rawUserInfo = JSON.stringify({ openid });
  }
  return {
    openid,
    token: accessToken,
    nickname,
    avatar,
    rawTokenInfo: JSON.stringify(tokenResp.data ?? {}),
    rawUserInfo,
  };
}

async function exchangeGitee(
  client: SocialClientDO,
  code: string,
  redirectUri?: string,
): Promise<SocialOAuthProfile> {
  const tokenResp = await axios.post(
    'https://gitee.com/oauth/token',
    null,
    {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: client.clientId,
        client_secret: client.clientSecret,
        redirect_uri: redirectUri || '',
      },
      timeout: HTTP_TIMEOUT,
    },
  );
  const accessToken = tokenResp.data?.access_token as string | undefined;
  if (!accessToken) {
    throw new HttpException(
      `Gitee 换取 access_token 失败：${JSON.stringify(tokenResp.data ?? {})}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  const userResp = await axios.get('https://gitee.com/api/v5/user', {
    params: { access_token: accessToken },
    timeout: HTTP_TIMEOUT,
  });
  const openid = String(userResp.data?.id ?? '');
  if (!openid) {
    throw new HttpException(SocialError.GITEE_USERINFO_FAILED, HttpStatus.BAD_REQUEST);
  }
  return {
    openid,
    token: accessToken,
    nickname: (userResp.data?.name as string) || (userResp.data?.login as string) || openid,
    avatar: (userResp.data?.avatar_url as string) || '',
    rawTokenInfo: JSON.stringify(tokenResp.data ?? {}),
    rawUserInfo: JSON.stringify(userResp.data ?? {}),
  };
}
