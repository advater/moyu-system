import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PASSWORD_HISTORY_LIMIT } from '@/config/constants';
import { UserError } from '@/config/error-messages';
import { comparePwd } from '@/utils/password';
import { assertUserPassword } from '@/utils/password-strength';
import { UserRepository } from './repositories/user.repository';

/**
 * 用户密码策略服务
 *
 * 统一「创建用户 / 管理员重置 / 用户自助改密」三处的密码规则：
 * 强度校验 + 最近 N 次使用过的密码不可复用。
 */
@Injectable()
export class UserPasswordService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 校验新密码是否可用
   *
   * @param userId 已存在的用户编号；创建用户时传 undefined（仅做强度校验）
   */
  async assertNewPassword(
    userId: number | undefined,
    newPassword: string,
  ): Promise<void> {
    assertUserPassword(newPassword);
    if (userId === undefined) return;

    const user = await this.userRepository.selectById(userId);
    const history = await this.userRepository.selectRecentPasswordHashes(
      userId,
      PASSWORD_HISTORY_LIMIT,
    );
    // 当前密码 + 历史密码均不可复用
    const candidates = [user?.password, ...history].filter(
      (hash): hash is string => !!hash,
    );
    for (const hash of candidates) {
      if (await comparePwd(newPassword, hash)) {
        throw new HttpException(
          UserError.PASSWORD_REUSED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /** 改密 / 重置成功后记录旧密码，使后续校验可拦截「复用最近密码」 */
  async recordPasswordChange(
    userId: number,
    oldPasswordHash: string | undefined,
  ): Promise<void> {
    if (!oldPasswordHash) return;
    await this.userRepository.insertPasswordHistory(
      userId,
      oldPasswordHash,
      PASSWORD_HISTORY_LIMIT,
    );
  }
}
