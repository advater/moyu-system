import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  SocialClientPageReqDTO,
  SocialClientResDTO,
  SocialClientSaveReqDTO,
} from './dto/socialClient.dto';
import { SocialClientRepository } from './repositories/socialClient.repository';
import { SocialClientDO } from './entities/socialClient.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { CommonError, Oauth2Error, SocialError } from '@/config/error-messages';
import { maskSecret, shouldKeepExistingSecret } from '@/utils/sanitize';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DEFAULT_TENANT_ID, SocialTypeEnum } from '@/config/constants';
import axios from 'axios';

/** 调用三方（企业微信/钉钉）HTTP 接口的超时时间：10 秒 */
const HTTP_TIMEOUT = 10_000;

/**
 * 社交客户端 Service
 */
@Injectable()
export class SocialClientService {
  constructor(
    private readonly socialClientRepository: SocialClientRepository,
  ) {}

  /**
   * 创建社交客户端
   */
  async createSocialClient(req: SocialClientSaveReqDTO): Promise<number> {
    // clientId 不允许重复
    const exists = await this.socialClientRepository.selectByUnique({
      clientId: req.clientId,
    });
    if (exists) {
      throw new HttpException(
        SocialError.CLIENT_ID_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!req.clientSecret) {
      throw new HttpException(Oauth2Error.SECRET_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // create 语义下忽略前端传入的 id（数据库自增）
    return this.socialClientRepository.insert({
      tenantId: TenantContext.requireTenantId(DEFAULT_TENANT_ID),
      name: req.name,
      socialType: req.socialType,
      userType: req.userType,
      status: req.status,
      clientId: req.clientId,
      clientSecret: req.clientSecret,
      agentId: req.agentId ?? null,
      publicKey: req.publicKey ?? null,
    });
  }

  /**
   * 修改社交客户端
   */
  async updateSocialClient(req: SocialClientSaveReqDTO): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(CommonError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    // 存在性校验
    const client = await this.socialClientRepository.selectById(id);
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    // clientId 唯一（排除自身）
    const conflict = await this.socialClientRepository.selectByUnique({
      clientId: req.clientId,
      id: { not: id },
    });
    if (conflict) {
      throw new HttpException(
        SocialError.CLIENT_ID_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.socialClientRepository.updateById(id, {
      name: req.name,
      socialType: req.socialType,
      userType: req.userType,
      status: req.status,
      clientId: req.clientId,
      clientSecret: shouldKeepExistingSecret(req.clientSecret)
        ? client.clientSecret
        : req.clientSecret!,
      agentId: req.agentId ?? client.agentId,
      publicKey: req.publicKey ?? client.publicKey,
    });
  }

  /**
   * 删除社交客户端
   */
  async deleteSocialClient(id: number): Promise<boolean> {
    const client = await this.socialClientRepository.selectById(id);
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.socialClientRepository.deleteById(id);
  }

  /**
   * 批量删除社交客户端
   */
  async deleteSocialClientList(ids: number[]): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    return this.socialClientRepository.deleteBatchIds(ids);
  }

  /**
   * 获取社交客户端详情
   */
  async getSocialClient(id: number): Promise<SocialClientResDTO> {
    const client = await this.socialClientRepository.selectById(id);
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(client);
  }

  /**
   * 获取社交客户端分页列表
   */
  async getSocialClientPage(
    req: SocialClientPageReqDTO,
  ): Promise<PageResult<SocialClientResDTO>> {
    const where = {
      ...(req.name ? { name: { contains: req.name } } : {}),
      ...(req.socialType !== undefined ? { socialType: req.socialType } : {}),
      ...(req.userType !== undefined ? { userType: req.userType } : {}),
      ...(req.clientId ? { clientId: { contains: req.clientId } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
    };
    const { list, total } = await this.socialClientRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((client) => this.toResDTO(client)), total };
  }

  /**
   * 发送订阅消息（测试/对接用）
   *
   * 请求体为自由 JSON 对象，字段约定如下：
   *   - socialClientId: number 必填 —— 社交客户端 ID（sys_social_client.id），
   *     据此查出该客户端的社交类型与密钥配置；
   *   - touser: string —— 接收人标识。企业微信：成员 UserID，多个可用 | 或 , 分隔（企业微信必填）；
   *   - content: string —— 消息内容（文本，发送渠道均必填）；
   *   - userids: string —— 钉钉专用可选补充字段：接收人 userid 列表，多个用逗号分隔（钉钉必填）。
   *
   * 实现流程：
   *   1. socialClientRepository.selectById(socialClientId) 校验存在性（不存在抛 400 SOCIAL.CLIENT_NOT_FOUND）；
   *   2. 按 client.socialType 分发：
   *      - 企业微信：先 gettoken 换 access_token，再调 message/send 发送文本应用消息；
   *      - 钉钉：先 gettoken 换 access_token，再调 topapi/message/corpconversation/asyncsend_v2
   *        发送文本工作通知；
   *      - 其它类型/公众号订阅消息：抛"暂不支持的社交类型"。
   *   3. 三方 HTTP 调用均使用 axios，超时 10 秒；失败抛中文 HttpException（400/500）。
   */
  async sendSubscribeMessage(req: Record<string, any>): Promise<boolean> {
    // 基础参数校验：socialClientId 必填且为数字
    const socialClientId = req?.socialClientId;
    if (
      socialClientId === undefined ||
      socialClientId === null ||
      Number.isNaN(Number(socialClientId))
    ) {
      throw new HttpException(
        SocialError.CLIENT_ID_PARAM_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 1. 查询社交客户端（不存在抛 400）
    const client = await this.socialClientRepository.selectById(
      Number(socialClientId),
    );
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 2. 按社交类型分发到具体三方渠道（含早期 1/2 取值）
    switch (client.socialType) {
      case SocialTypeEnum.WECHAT_ENTERPRISE:
      case SocialTypeEnum.WECHAT_ENTERPRISE_LEGACY:
        return this.sendWeComWorkMessage(client, req);
      case SocialTypeEnum.DING_TALK:
      case SocialTypeEnum.DING_TALK_LEGACY:
        return this.sendDingTalkWorkMessage(client, req);
      default:
        throw new HttpException(
          SocialError.SEND_TYPE_UNSUPPORTED,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  /**
   * 企业微信：发送应用「文本」工作通知
   *
   * 流程：
   * 1. GET https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={clientId}&corpsecret={clientSecret}
   *    获取 access_token（clientId 即企业 ID corpid，clientSecret 即应用 Secret）；
   * 2. POST https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={token}
   *    发送 { touser, msgtype: 'text', agentid: {agentId 转数字}, text: { content } }。
   */
  private async sendWeComWorkMessage(
    client: SocialClientDO,
    req: Record<string, any>,
  ): Promise<boolean> {
    const touser = req?.touser;
    if (!touser) {
      throw new HttpException(
        SocialError.WECOM_TOUSER_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const content = req?.content;
    if (!content) {
      throw new HttpException(
        SocialError.WECOM_CONTENT_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const agentId = Number(client.agentId);
    if (!client.agentId || Number.isNaN(agentId)) {
      throw new HttpException(
        SocialError.WECOM_AGENT_ID_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 1. 获取 access_token
    const accessToken = await this.getWeComAccessToken(
      client.clientId,
      client.clientSecret,
    );
    // 2. 发送应用消息
    const response = await axios
      .post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
          touser,
          msgtype: 'text',
          agentid: agentId,
          text: { content },
        },
        { timeout: HTTP_TIMEOUT },
      )
      .catch((error) => {
        throw new HttpException(
          `企业微信发送消息请求异常：${this.errorText(error)}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (response.data?.errcode !== 0) {
      throw new HttpException(
        `企业微信消息发送失败：${response.data?.errmsg ?? `errcode=${response.data?.errcode}`}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return true;
  }

  /**
   * 钉钉：发送工作通知「文本」消息
   *
   * 流程：
   * 1. GET https://oapi.dingtalk.com/gettoken?appkey={clientId}&appsecret={clientSecret}
   *    获取 access_token；
   * 2. POST https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token={token}
   *    发送 { agent_id, userid_list, msg: { msgtype: 'text', text: { content } } }。
   *
   * 注：钉钉的 agent_id 复用社交客户端的 agentId 字段（应用 AgentId）。
   */
  private async sendDingTalkWorkMessage(
    client: SocialClientDO,
    req: Record<string, any>,
  ): Promise<boolean> {
    const userids = req?.userids;
    if (!userids) {
      throw new HttpException(
        SocialError.DINGTALK_USERIDS_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const content = req?.content;
    if (!content) {
      throw new HttpException(
        SocialError.DINGTALK_CONTENT_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    const agentId = Number(client.agentId);
    if (!client.agentId || Number.isNaN(agentId)) {
      throw new HttpException(
        SocialError.DINGTALK_AGENT_ID_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 1. 获取 access_token
    const accessToken = await this.getDingTalkAccessToken(
      client.clientId,
      client.clientSecret,
    );
    // 2. 发送工作通知
    const response = await axios
      .post(
        `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${accessToken}`,
        {
          agent_id: agentId,
          userid_list: userids,
          msg: { msgtype: 'text', text: { content } },
        },
        { timeout: HTTP_TIMEOUT },
      )
      .catch((error) => {
        throw new HttpException(
          `钉钉发送工作通知请求异常：${this.errorText(error)}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (response.data?.errcode !== 0) {
      throw new HttpException(
        `钉钉工作通知发送失败：${response.data?.errmsg ?? `errcode=${response.data?.errcode}`}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return true;
  }

  /**
   * 获取企业微信 access_token
   */
  private async getWeComAccessToken(
    corpid: string,
    corpsecret: string,
  ): Promise<string> {
    const response = await axios
      .get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: { corpid, corpsecret },
        timeout: HTTP_TIMEOUT,
      })
      .catch((error) => {
        throw new HttpException(
          `企业微信获取 access_token 失败：${this.errorText(error)}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    const data = response.data;
    if (!data || data.errcode !== 0) {
      throw new HttpException(
        `企业微信获取 access_token 失败：${data?.errmsg ?? '未返回有效凭证'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data.access_token;
  }

  /**
   * 获取钉钉 access_token
   */
  private async getDingTalkAccessToken(
    appKey: string,
    appSecret: string,
  ): Promise<string> {
    const response = await axios
      .get('https://oapi.dingtalk.com/gettoken', {
        params: { appkey: appKey, appsecret: appSecret },
        timeout: HTTP_TIMEOUT,
      })
      .catch((error) => {
        throw new HttpException(
          `钉钉获取 access_token 失败：${this.errorText(error)}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    const data = response.data;
    if (!data || data.errcode !== 0) {
      throw new HttpException(
        `钉钉获取 access_token 失败：${data?.errmsg ?? '未返回有效凭证'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data.access_token;
  }

  /**
   * 将 axios/未知异常转换为可读文本
   */
  private errorText(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.message || '网络请求失败';
    }
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * 社交客户端 DO → ResDTO
   */
  private toResDTO(client: SocialClientDO): SocialClientResDTO {
    const resp = new SocialClientResDTO();
    resp.id = client.id;
    resp.name = client.name;
    resp.socialType = client.socialType;
    resp.userType = client.userType;
    resp.clientId = client.clientId;
    resp.clientSecret = maskSecret(client.clientSecret);
    resp.agentId = client.agentId ?? undefined;
    resp.publicKey = client.publicKey ?? undefined;
    resp.status = client.status;
    resp.createTime = formatDate(client.createTime);
    return resp;
  }
}
