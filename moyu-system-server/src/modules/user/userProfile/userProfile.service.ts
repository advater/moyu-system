import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  UserProfileResDTO,
  UserProfileUpdatePasswordReqDTO,
  UserProfileUpdateReqDTO,
} from './dto/userProfile.dto';
import { UserRepository } from '../user/repositories/user.repository';
import { UserProfileRepository } from './repositories/userProfile.repository';
import { UserRoleRepository } from '../../permission/role/repositories/userRole.repository';
import { RoleRepository } from '../../permission/role/repositories/role.repository';
import { DeptService } from '../../dept/dept/dept.service';
import { PostService } from '../../dept/post/post.service';
import { RoleSimpleResDTO } from '../../permission/role/dto/role.dto';
import { DeptSimpleResDTO } from '../../dept/dept/dto/dept.dto';
import { PostSimpleResDTO } from '../../dept/post/dto/post.dto';
import { formatDate } from '@/utils/date';
import { hashPassword, comparePwd } from '@/utils/password';
import { AuthError, UserError } from '@/config/error-messages';
import { buildUserProfilePatch } from './user-profile-patch';
import { FileService } from '@/modules/file/file.service';
import { UserPasswordService } from '../user/user-password.service';

const PROFILE_PATCH_KEYS = [
  'nickname',
  'email',
  'mobile',
  'sex',
  'avatar',
] as const;

/**
 * 用户信息 Service（个人资料读写独立表 sys_user_profile）
 */
@Injectable()
export class UserProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly roleRepository: RoleRepository,
    private readonly deptService: DeptService,
    private readonly postService: PostService,
    private readonly fileService: FileService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  async getUserProfileById(userId: number): Promise<UserProfileResDTO> {
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const profile = await this.userProfileRepository.selectByUserId(userId);
    const resp = new UserProfileResDTO();
    resp.id = user.id;
    resp.username = user.username;
    resp.nickname = profile?.nickname ?? undefined;
    resp.email = profile?.email ?? undefined;
    resp.mobile = profile?.mobile ?? undefined;
    resp.sex = profile?.sex ?? undefined;
    resp.avatar = profile?.avatar ?? undefined;
    resp.loginIp = user.loginIp ?? '';
    resp.loginDate = user.loginDate ? formatDate(user.loginDate) : '';
    resp.createTime = formatDate(user.createTime);
    const roleIds = await this.userRoleRepository.selectRoleIdsByUserId(userId);
    const roles = await this.roleRepository.selectByIds(roleIds);
    resp.roles = roles.map((role) => {
      const simple = new RoleSimpleResDTO();
      simple.id = role.id;
      simple.name = role.name;
      return simple;
    });
    resp.dept = await this.resolveDeptSimple(user.deptId ?? undefined);
    resp.posts = await this.resolvePostSimpleList(
      Array.isArray(user.postIds) ? user.postIds : [],
    );
    return resp;
  }

  /** 上传头像：写入文件模块后更新资料 avatar URL */
  async updateAvatar(
    userId: number,
    buffer: Buffer,
    filename: string,
    mime?: string,
  ): Promise<string> {
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const uploaded = await this.fileService.upload(buffer, filename, mime, [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ]);
    await this.userProfileRepository.upsertByUserId(userId, {
      tenantId: user.tenantId,
      avatar: uploaded.url,
    });
    return uploaded.url;
  }

  /**
   * 修改个人资料（写入 sys_user_profile；未传不改，空串/null 清空）
   */
  async updateProfileById(
    userId: number,
    req: UserProfileUpdateReqDTO,
  ): Promise<boolean> {
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const presentKeys = new Set(
      PROFILE_PATCH_KEYS.filter((key) =>
        Object.prototype.hasOwnProperty.call(req, key),
      ),
    );
    const patch = buildUserProfilePatch(req, presentKeys);
    if (Object.keys(patch).length === 0) {
      return true;
    }

    const excludeUserId = { userId: { not: userId } };
    if (
      presentKeys.has('email') &&
      typeof patch.email === 'string' &&
      patch.email
    ) {
      const exists = await this.userProfileRepository.selectByUnique({
        email: patch.email,
        ...excludeUserId,
      });
      if (exists) {
        throw new HttpException(
          UserError.EMAIL_USED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (
      presentKeys.has('mobile') &&
      typeof patch.mobile === 'string' &&
      patch.mobile
    ) {
      const exists = await this.userProfileRepository.selectByUnique({
        mobile: patch.mobile,
        ...excludeUserId,
      });
      if (exists) {
        throw new HttpException(
          UserError.PHONE_USED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.userProfileRepository.upsertByUserId(userId, {
      tenantId: user.tenantId,
      ...patch,
    });
    return true;
  }

  async updatePasswordByUserId(
    userId: number,
    req: UserProfileUpdatePasswordReqDTO,
  ): Promise<boolean> {
    const user = await this.userRepository.selectById(userId);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const matched = await comparePwd(req.oldPassword, user.password);
    if (!matched) {
      throw new HttpException(
        AuthError.ORIGINAL_PASSWORD_WRONG,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 密码强度校验 + 历史密码不可复用
    await this.userPasswordService.assertNewPassword(userId, req.newPassword);
    const updated = await this.userRepository.updateById(userId, {
      password: await hashPassword(req.newPassword),
      passwordUpdateTime: new Date(),
      mustChangePassword: false,
    });
    if (updated) {
      await this.userPasswordService.recordPasswordChange(userId, user.password);
    }
    return updated;
  }

  private async resolveDeptSimple(
    deptId?: number,
  ): Promise<DeptSimpleResDTO | undefined> {
    if (deptId === undefined) {
      return undefined;
    }
    const deptList = await this.deptService.getDeptListUnscoped({});
    const found = deptList.find((dept) => dept.id === deptId);
    if (!found) {
      return undefined;
    }
    const resp = new DeptSimpleResDTO();
    resp.id = found.id;
    resp.name = found.name;
    resp.parentId = found.parentId ?? 0;
    return resp;
  }

  private async resolvePostSimpleList(
    postIds?: number[],
  ): Promise<PostSimpleResDTO[]> {
    const ids = Array.isArray(postIds) ? postIds : [];
    if (ids.length === 0) {
      return [];
    }
    const postList = await this.postService.getSimplePostList();
    const idSet = new Set(ids);
    return postList
      .filter((post) => idSet.has(post.id))
      .map((post) => {
        const resp = new PostSimpleResDTO();
        resp.id = post.id;
        resp.name = post.name;
        return resp;
      });
  }
}
