import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  OAuth2ClientPageReqDTO,
  OAuth2ClientResDTO,
  OAuth2ClientSaveReqDTO,
} from './dto/oauth2Client.dto';
import { OAuth2ClientDO } from './entities/oauth2Client.entity';
import { OAuth2ClientRepository } from './repositories/oauth2Client.repository';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { Oauth2Error } from '@/config/error-messages';
import { maskSecret, shouldKeepExistingSecret } from '@/utils/sanitize';
import { assertSecretStrength } from '@/utils/password-strength';

/**
 * OAuth2 客户端 Service
 */
@Injectable()
export class OAuth2ClientService {
  constructor(
    private readonly oauth2ClientRepository: OAuth2ClientRepository,
  ) {}

  /** 创建 OAuth2 客户端，返回客户端主键 */
  async createOAuth2Client(req: OAuth2ClientSaveReqDTO): Promise<number> {
    // 校验 clientId 唯一
    const exist = await this.oauth2ClientRepository.selectByClientId(req.clientId);
    if (exist) {
      throw new HttpException(Oauth2Error.CLIENT_ID_EXISTS, HttpStatus.BAD_REQUEST);
    }
    if (!req.secret) {
      throw new HttpException(Oauth2Error.SECRET_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    try {
      assertSecretStrength(req.secret, 'OAuth2 客户端密钥', 32);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : '客户端密钥不合规',
        HttpStatus.BAD_REQUEST,
      );
    }
    const created = await this.oauth2ClientRepository.insert({
      clientId: req.clientId,
      secret: req.secret,
      name: req.name,
      logo: req.logo ?? null,
      description: req.description ?? null,
      status: req.status,
      accessTokenValiditySeconds: req.accessTokenValiditySeconds,
      refreshTokenValiditySeconds: req.refreshTokenValiditySeconds,
      // Json 数组字段：未传一律给空数组，保证返回结构稳定
      redirectUris: [],
      authorizedGrantTypes: (req.authorizedGrantTypes ?? []),
      scopes: (req.scopes ?? []),
      autoApproveScopes: (req.autoApproveScopes ?? []),
      authorities: (req.authorities ?? []),
      resourceIds: (req.resourceIds ?? []),
      additionalInformation: req.additionalInformation ?? null,
    });
    return created.id;
  }

  /** 修改 OAuth2 客户端 */
  async updateOAuth2Client(req: OAuth2ClientSaveReqDTO): Promise<boolean> {
    const id = req.id;
    if (!id) {
      throw new HttpException(Oauth2Error.CLIENT_NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
    const exist = await this.oauth2ClientRepository.selectById(id);
    if (!exist) {
      throw new HttpException(Oauth2Error.CLIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    // 修改 clientId 时校验唯一（排除自身）
    if (req.clientId !== exist.clientId) {
      const conflict = await this.oauth2ClientRepository.selectByClientId(req.clientId);
      if (conflict) {
        throw new HttpException(Oauth2Error.CLIENT_ID_EXISTS, HttpStatus.BAD_REQUEST);
      }
    }
    return this.oauth2ClientRepository.updateById(id, {
      clientId: req.clientId,
      secret: (() => {
        if (shouldKeepExistingSecret(req.secret)) return exist.secret;
        try {
          assertSecretStrength(req.secret, 'OAuth2 客户端密钥', 32);
        } catch (err) {
          throw new HttpException(
            err instanceof Error ? err.message : '客户端密钥不合规',
            HttpStatus.BAD_REQUEST,
          );
        }
        return req.secret!;
      })(),
      name: req.name,
      logo: req.logo ?? null,
      description: req.description ?? null,
      status: req.status,
      accessTokenValiditySeconds: req.accessTokenValiditySeconds,
      refreshTokenValiditySeconds: req.refreshTokenValiditySeconds,
      authorizedGrantTypes: (req.authorizedGrantTypes ?? []),
      scopes: (req.scopes ?? []),
      autoApproveScopes: (req.autoApproveScopes ?? []),
      authorities: (req.authorities ?? []),
      resourceIds: (req.resourceIds ?? []),
      additionalInformation: req.additionalInformation ?? null,
    });
  }

  /** 删除 OAuth2 客户端（软删除） */
  async deleteOAuth2Client(id: number): Promise<boolean> {
    const exist = await this.oauth2ClientRepository.selectById(id);
    if (!exist) {
      throw new HttpException(Oauth2Error.CLIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.oauth2ClientRepository.deleteById(id);
  }

  /** 批量删除 OAuth2 客户端（软删除） */
  async deleteOAuth2ClientList(ids: number[]): Promise<boolean> {
    return this.oauth2ClientRepository.deleteByIds(ids);
  }

  /** 获得 OAuth2 客户端详情 */
  async getOAuth2Client(id: number): Promise<OAuth2ClientResDTO> {
    const exist = await this.oauth2ClientRepository.selectById(id);
    if (!exist) {
      throw new HttpException(Oauth2Error.CLIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.toResDTO(exist);
  }

  /** 获得 OAuth2 客户端分页 */
  async getOAuth2ClientPage(
    req: OAuth2ClientPageReqDTO,
  ): Promise<PageResult<OAuth2ClientResDTO>> {
    const where: any = {};
    if (req.name) {
      where.name = { contains: req.name };
    }
    if (req.status !== undefined && req.status !== null) {
      where.status = req.status;
    }
    const { page, pageSize } = req;
    const result = await this.oauth2ClientRepository.selectPage({ page, pageSize }, where);
    return {
      list: result.list.map((item) => this.toResDTO(item)),
      total: result.total,
    };
  }

  /** 根据客户端编号查询（供 oauth2Open 授权/令牌流程使用） */
  async getOAuth2ClientByClientId(clientId: string): Promise<OAuth2ClientDO | null> {
    return this.oauth2ClientRepository.selectByClientId(clientId);
  }

  /** OAuth2ClientDO → ResDTO */
  private toResDTO(item: OAuth2ClientDO): OAuth2ClientResDTO {
    const vo = new OAuth2ClientResDTO();
    vo.id = item.id;
    vo.clientId = item.clientId;
    vo.secret = maskSecret(item.secret);
    vo.name = item.name;
    vo.logo = item.logo ?? '';
    vo.description = item.description ?? '';
    vo.status = item.status;
    vo.accessTokenValiditySeconds = item.accessTokenValiditySeconds;
    vo.refreshTokenValiditySeconds = item.refreshTokenValiditySeconds;
    vo.redirectUris = (item.redirectUris) ?? [];
    vo.authorizedGrantTypes = (item.authorizedGrantTypes) ?? [];
    vo.scopes = (item.scopes) ?? [];
    vo.autoApproveScopes = (item.autoApproveScopes) ?? [];
    vo.authorities = (item.authorities) ?? [];
    vo.resourceIds = (item.resourceIds) ?? [];
    vo.additionalInformation = item.additionalInformation ?? '';
    vo.createTime = formatDate(item.createTime);
    return vo;
  }
}
