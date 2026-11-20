import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  OAuth2UserInfoResDTO,
  OAuth2UserUpdateReqDTO,
} from './dto/oauth2User.dto';
import { UserProfileService } from '@/modules/user/userProfile/userProfile.service';
import { UserProfileUpdateReqDTO } from '@/modules/user/userProfile/dto/UserProfileUpdateReq.dto';
import { USER_TYPE_ADMIN } from '@/config/constants';
import { UserError } from '@/config/error-messages';

/**
 * OAuth2 用户 Service
 *
 * 供「当前访问令牌对应的资源所有者」查询 / 修改自身基本信息，
 * 用于 OAuth2.0 用户信息开放接口（UserInfo）。
 */
@Injectable()
export class OAuth2UserService {
  constructor(
    private readonly userProfileService: UserProfileService,
  ) {}

  /** 获得当前登录用户的基本信息（含部门、岗位） */
  async getUserInfo(
    userId: number,
    userType: number,
  ): Promise<OAuth2UserInfoResDTO> {
    this.checkUserType(userType);
    const profile = await this.userProfileService.getUserProfileById(userId);

    const vo = new OAuth2UserInfoResDTO();
    vo.id = profile.id;
    vo.username = profile.username;
    vo.nickname = profile.nickname ?? profile.username;
    vo.email = profile.email;
    vo.mobile = profile.mobile;
    vo.sex = profile.sex;
    vo.avatar = profile.avatar;
    vo.dept = profile.dept
      ? { id: profile.dept.id, name: profile.dept.name }
      : undefined;
    vo.posts = (profile.posts ?? []).map((post) => ({
      id: post.id,
      name: post.name,
    }));
    return vo;
  }

  /** 修改当前登录用户的基本信息 */
  async updateUserInfo(
    userId: number,
    userType: number,
    req: OAuth2UserUpdateReqDTO,
  ): Promise<boolean> {
    this.checkUserType(userType);
    const profileReq = new UserProfileUpdateReqDTO();
    const keys = ['nickname', 'email', 'mobile', 'sex'] as const;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(req, key)) {
        (profileReq as Record<string, unknown>)[key] = req[key];
      }
    }
    return this.userProfileService.updateProfileById(userId, profileReq);
  }

  /** 当前后端仅实现管理后台用户域（userType=1） */
  private checkUserType(userType: number): void {
    if (userType !== USER_TYPE_ADMIN) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
