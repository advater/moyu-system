import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  SocialUserBindReqDTO,
  SocialUserPageReqDTO,
  SocialUserResDTO,
  SocialUserUnbindReqDTO,
} from './dto/socialUser.dto';
import { SocialUserRepository } from './repositories/socialUser.repository';
import { SocialUserBindRepository } from './repositories/socialUserBind.repository';
import { SocialClientRepository } from '../socialClient/repositories/socialClient.repository';
import { SocialUserDO } from './entities/socialUser.entity';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { PermissionError, SocialError } from '@/config/error-messages';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { maskSecret } from '@/utils/sanitize';
import { USER_TYPE_ADMIN } from '@/config/constants';
import {
  exchangeSocialCode,
  SocialOAuthProfile,
} from '../social-oauth';

/**
 * 社交用户 Service
 */
@Injectable()
export class SocialUserService {
  constructor(
    private readonly socialUserRepository: SocialUserRepository,
    private readonly socialUserBindRepository: SocialUserBindRepository,
    private readonly socialClientRepository: SocialClientRepository,
  ) {}

  /**
   * 社交绑定（需登录）：code → 三方用户 → 绑定当前登录用户
   */
  async socialBind(
    req: SocialUserBindReqDTO,
    loginUser: LoginUser,
  ): Promise<boolean> {
    this.requireLogin(loginUser);
    const socialUserId = await this.authSocialUser(
      req.type,
      req.code,
      req.state,
      loginUser.userType ?? USER_TYPE_ADMIN,
    );
    const existsBind = await this.socialUserBindRepository.selectByUnique({
      socialType: req.type,
      socialUserId,
    });
    if (existsBind && existsBind.userId !== loginUser.id) {
      throw new HttpException(
        SocialError.BIND_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existsBind && existsBind.userId === loginUser.id) {
      return true;
    }
    // 同一用户同一社交类型仅保留一条绑定
    await this.socialUserBindRepository.deleteByWhere({
      userId: loginUser.id,
      userType: loginUser.userType,
      socialType: req.type,
    });
    await this.socialUserBindRepository.insert({
      userId: loginUser.id,
      userType: loginUser.userType,
      socialType: req.type,
      socialUserId,
    });
    return true;
  }

  /**
   * 授权码换取并 upsert 社交用户，返回 socialUserId
   */
  async authSocialUser(
    type: number,
    code: string,
    state: string,
    userType = USER_TYPE_ADMIN,
    redirectUri?: string,
  ): Promise<number> {
    const client = await this.socialClientRepository.selectByUnique({
      socialType: type,
      userType,
      status: 1,
    });
    if (!client) {
      throw new HttpException(
        SocialError.CLIENT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
    const profile = await exchangeSocialCode(client, code, redirectUri);
    return this.upsertSocialUser(type, code, state, profile);
  }

  /**
   * 按社交类型 + openid 查找已绑定的系统用户 ID
   */
  async getBindUserId(
    socialType: number,
    socialUserId: number,
    userType: number,
  ): Promise<number | null> {
    const bind = await this.socialUserBindRepository.selectByUnique({
      socialType,
      socialUserId,
      userType,
    });
    return bind?.userId ?? null;
  }

  /**
   * 取消社交绑定（需登录）
   */
  async socialUnbind(
    req: SocialUserUnbindReqDTO,
    loginUser: LoginUser,
  ): Promise<boolean> {
    this.requireLogin(loginUser);
    const socialUser = await this.socialUserRepository.selectByUnique({
      type: req.type,
      openid: req.openid,
    });
    if (!socialUser) {
      throw new HttpException(
        SocialError.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const bind = await this.socialUserBindRepository.selectByUnique({
      userId: loginUser.id,
      userType: loginUser.userType,
      socialType: req.type,
      socialUserId: socialUser.id,
    });
    if (!bind) {
      throw new HttpException(SocialError.BIND_RELATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.socialUserBindRepository.deleteByWhere({
      id: bind.id,
      userId: loginUser.id,
      userType: loginUser.userType,
    });
  }

  /**
   * 获得当前用户已绑定的社交账号列表（需登录）
   */
  async getBindSocialUserList(
    loginUser: LoginUser,
  ): Promise<SocialUserResDTO[]> {
    this.requireLogin(loginUser);
    const binds = await this.socialUserBindRepository.selectList({
      userId: loginUser.id,
      userType: loginUser.userType,
    });
    if (binds.length === 0) {
      return [];
    }
    const socialIds = binds.map((b) => b.socialUserId);
    const users = await this.socialUserRepository.selectByIds(socialIds);
    const byId = new Map(users.map((u) => [u.id, u]));
    return binds
      .map((b) => byId.get(b.socialUserId))
      .filter((u): u is SocialUserDO => !!u)
      .map((u) => this.toResDTO(u));
  }

  async getSocialUser(id: number): Promise<SocialUserResDTO> {
    const socialUser = await this.socialUserRepository.selectById(id);
    if (!socialUser) {
      throw new HttpException(
        SocialError.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResDTO(socialUser);
  }

  async getSocialUserPage(
    req: SocialUserPageReqDTO,
  ): Promise<PageResult<SocialUserResDTO>> {
    const where = {
      ...(req.type !== undefined ? { type: req.type } : {}),
      ...(req.nickname ? { nickname: { contains: req.nickname } } : {}),
      ...(req.openid ? { openid: { contains: req.openid } } : {}),
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    const { list, total } = await this.socialUserRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      where,
    );
    return { list: list.map((user) => this.toResDTO(user)), total };
  }

  private async upsertSocialUser(
    type: number,
    code: string,
    state: string,
    profile: SocialOAuthProfile,
  ): Promise<number> {
    const exists = await this.socialUserRepository.selectByUnique({
      type,
      openid: profile.openid,
    });
    const data = {
      type,
      openid: profile.openid,
      token: profile.token,
      rawTokenInfo: profile.rawTokenInfo,
      nickname: profile.nickname,
      avatar: profile.avatar,
      rawUserInfo: profile.rawUserInfo,
      code,
      state,
    };
    if (exists) {
      await this.socialUserRepository.updateById(exists.id, data);
      return exists.id;
    }
    return this.socialUserRepository.insert(data);
  }

  private requireLogin(loginUser?: LoginUser): void {
    if (!loginUser?.id) {
      throw new HttpException(
        PermissionError.NOT_LOGGED_IN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private toResDTO(user: SocialUserDO): SocialUserResDTO {
    const resp = new SocialUserResDTO();
    resp.id = user.id;
    resp.type = user.type;
    resp.openid = user.openid;
    resp.token = maskSecret(user.token);
    resp.rawTokenInfo = '';
    resp.nickname = user.nickname ?? '';
    resp.avatar = user.avatar ?? undefined;
    resp.rawUserInfo = '';
    resp.code = '';
    resp.state = '';
    resp.createTime = formatDate(user.createTime);
    resp.updateTime = formatDate(user.updateTime);
    return resp;
  }
}
