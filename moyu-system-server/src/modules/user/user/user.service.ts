import { xl } from '@/i18n/xl';
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  UserPageReqDTO,
  UserResDTO,
  UserSaveReqDTO,
  UserSimpleResDTO,
  UserUpdatePasswordReqDTO,
  UserUpdateStatusReqDTO,
} from './dto/user.dto';
import { UserImportResDTO } from './dto/UserImportRes.dto';
import { UserRepository } from './repositories/user.repository';
import { UserProfileRepository } from '../userProfile/repositories/userProfile.repository';
import { UserDO } from './entities/user.entity';
import { UserProfileDO } from '../userProfile/entities/userProfile.entity';
import { DeptService } from '../../dept/dept/dept.service';
import { PostService } from '../../dept/post/post.service';
import { PageResult } from '@/types';
import { formatDate } from '@/utils/date';
import { toIntArray } from '@/utils/to-positive-int';
import {
  buildExcelExport,
  excelCellToString,
  ExcelExportResult,
  EXCEL_MAX_ROWS,
} from '@/utils/excel-export';
import { hashPassword } from '@/utils/password';
import { assertPasswordStrength } from '@/utils/password-strength';
import { ExportError, PermissionError, UserError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import {
  ADMIN_USERNAME,
  DEFAULT_TENANT_ID,
} from '@/config/constants';
import { DataScopeService } from '@/modules/permission/permission/data-scope.service';
import type { LoginUser } from '@/common/decorator/login-user.decorator';
import { TenantPolicyService } from '@/modules/tenant/policy/tenant-policy.service';
import { UserPasswordService } from './user-password.service';
import { Prisma } from '@/generated/prisma/client';

/**
 * 用户管理 Service
 */
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly deptService: DeptService,
    private readonly postService: PostService,
    @Inject(forwardRef(() => DataScopeService))
    private readonly dataScopeService: DataScopeService,
    private readonly tenantPolicyService: TenantPolicyService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  private currentTenantId(): string {
    return TenantContext.requireTenantId(DEFAULT_TENANT_ID);
  }

  /** 合并业务 where 与数据权限（fail-close：无登录上下文直接拒绝） */
  private async mergeDataScopeWhere(
    loginUser: LoginUser | undefined,
    where: Prisma.SysUserWhereInput,
  ): Promise<Prisma.SysUserWhereInput> {
    if (!loginUser?.id) {
      throw new HttpException(
        PermissionError.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
      );
    }
    const scope = await this.dataScopeService.resolveForUser(loginUser);
    const scopeWhere = this.dataScopeService.toUserWhere(scope);
    if (!scopeWhere) return where;
    if (Object.keys(where).length === 0) return scopeWhere;
    return { AND: [where, scopeWhere] };
  }

  /**
   * 创建用户
   */
  async createUser(
    req: UserSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<number> {
    const tenantId = this.currentTenantId();
    await this.tenantPolicyService.assertCanCreateUsers(tenantId, 1);
    // 目标部门须在操作者数据权限内
    if (req.deptId !== undefined) {
      await this.dataScopeService.assertDeptAccessible(loginUser, req.deptId);
    }
    // 引用岗位须存在
    await this.postService.assertPostsExist(req.postIds);
    // 密码强度校验（新建用户无历史密码可比对）
    await this.userPasswordService.assertNewPassword(undefined, req.password);
    // 用户账号唯一（租户维度）
    const sameUsername = await this.userRepository.selectByUnique({
      username: req.username,
    });
    if (sameUsername) {
      throw new HttpException(
        UserError.ACCOUNT_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.checkEmailMobileUnique(req.email, req.mobile);
    const nickname = req.nickname?.trim() || req.username;
    const userId = await this.userRepository.insertWithPosts(
      {
        tenantId,
        username: req.username,
        password: await hashPassword(req.password),
        remark: req.remark ?? null,
        deptId: req.deptId ?? null,
        postIds: req.postIds ?? [],
        status: 1,
        passwordUpdateTime: new Date(),
      },
      req.postIds ?? [],
    );
    await this.userProfileRepository.upsertByUserId(userId, {
      tenantId,
      nickname,
      email: req.email ?? null,
      mobile: req.mobile ?? null,
      sex: req.sex ?? null,
      avatar: req.avatar ?? null,
    });
    return userId;
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    req: UserSaveReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const id = req.id;
    if (id === undefined) {
      throw new HttpException(UserError.ID_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const user = await this.userRepository.selectById(id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    // 变更所属部门时，新部门须在操作者数据权限内
    if (req.deptId !== undefined && req.deptId !== user.deptId) {
      await this.dataScopeService.assertDeptAccessible(loginUser, req.deptId);
    }
    // 引用岗位须存在
    await this.postService.assertPostsExist(req.postIds);
    const tenantId = this.currentTenantId();
    // 唯一性校验（排除自身）
    const sameUsername = await this.userRepository.selectByUnique({
      username: req.username,
      id: { not: id },
    });
    if (sameUsername) {
      throw new HttpException(
        UserError.ACCOUNT_EXISTS,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.checkEmailMobileUnique(req.email, req.mobile, id);
    const existingProfile = await this.userProfileRepository.selectByUserId(id);
    const nickname =
      req.nickname?.trim() ||
      existingProfile?.nickname ||
      req.username;
    await this.userRepository.updateByIdWithPosts(
      id,
      {
        username: req.username,
        remark: req.remark ?? user.remark,
        deptId: req.deptId ?? user.deptId,
        postIds: req.postIds ?? [],
      },
      req.postIds ?? [],
    );
    await this.userProfileRepository.upsertByUserId(id, {
      tenantId,
      nickname,
      email: req.email ?? existingProfile?.email ?? null,
      mobile: req.mobile ?? existingProfile?.mobile ?? null,
      sex: req.sex ?? existingProfile?.sex ?? null,
      avatar: req.avatar ?? existingProfile?.avatar ?? null,
    });
    return true;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number, loginUser?: LoginUser): Promise<boolean> {
    const user = await this.userRepository.selectById(id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    this.assertNotSelf(loginUser, id);
    this.assertProtectedAdminNotDeleted(user);
    return this.userRepository.deleteById(id);
  }

  /**
   * 批量删除用户
   */
  async deleteUserList(
    ids: number[],
    loginUser?: LoginUser,
  ): Promise<boolean> {
    if (!ids || ids.length === 0) {
      return false;
    }
    const users = await this.userRepository.selectByIds(ids);
    for (const user of users) {
      await this.dataScopeService.assertUserAccessible(loginUser, user);
      this.assertNotSelf(loginUser, user.id);
      this.assertProtectedAdminNotDeleted(user);
    }
    return this.userRepository.deleteBatchByIds(ids);
  }

  /**
   * 重置用户密码
   */
  async updateUserPassword(
    req: UserUpdatePasswordReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const user = await this.userRepository.selectById(req.id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    // 密码强度校验 + 历史密码不可复用
    await this.userPasswordService.assertNewPassword(req.id, req.password);
    const updated = await this.userRepository.updateById(req.id, {
      password: await hashPassword(req.password),
      passwordUpdateTime: new Date(),
      mustChangePassword: true,
    });
    if (updated) {
      await this.userPasswordService.recordPasswordChange(req.id, user.password);
      // 重置密码后作废该用户既有会话：访问令牌立即失效，刷新令牌也因改密被拒
      await this.userRepository.incrementPermVersionByIds([req.id]);
    }
    return updated;
  }

  /**
   * 修改用户状态
   */
  async updateUserStatus(
    req: UserUpdateStatusReqDTO,
    loginUser?: LoginUser,
  ): Promise<boolean> {
    const user = await this.userRepository.selectById(req.id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    this.assertNotSelf(loginUser, req.id);
    this.assertProtectedAdminStatus(user, req.status);
    const updated = await this.userRepository.updateById(req.id, {
      status: req.status,
    });
    if (updated) {
      // 状态变更即时生效：递增权限版本使既有访问令牌失效，禁用用户无法继续用旧令牌访问
      await this.userRepository.incrementPermVersionByIds([req.id]);
    }
    return updated;
  }

  /**
   * 获取用户分页列表
   */
  async getUserPage(
    req: UserPageReqDTO,
    loginUser?: LoginUser,
  ): Promise<PageResult<UserResDTO>> {
    const where: Record<string, unknown> = {
      ...(req.username ? { username: { contains: req.username } } : {}),
      ...(req.status !== undefined ? { status: req.status } : {}),
      ...(req.createTime && req.createTime.length === 2
        ? {
            createTime: {
              gte: new Date(req.createTime[0]),
              lte: new Date(req.createTime[1]),
            },
          }
        : {}),
    };
    if (req.mobile) {
      const mobileUserIds =
        await this.userProfileRepository.selectUserIdsByMobileContains(
          req.mobile,
        );
      if (mobileUserIds.length === 0) {
        return { list: [], total: 0 };
      }
      where.id = { in: mobileUserIds };
    }
    if (req.deptId !== undefined) {
      const deptIds = await this.collectSubDeptIds(req.deptId);
      if (deptIds.length === 0) {
        return { list: [], total: 0 };
      }
      where.deptId = { in: deptIds };
    }
    if (req.roleId !== undefined) {
      const userIds = await this.userRepository.selectUserIdsByRoleId(req.roleId);
      if (userIds.length === 0) {
        return { list: [], total: 0 };
      }
      const prev = where.id as { in: number[] } | undefined;
      where.id = prev?.in
        ? { in: prev.in.filter((id) => userIds.includes(id)) }
        : { in: userIds };
      if ((where.id as { in: number[] }).in.length === 0) {
        return { list: [], total: 0 };
      }
    }
    const scopedWhere = await this.mergeDataScopeWhere(loginUser, where);
    const { list, total } = await this.userRepository.selectPage(
      { page: req.page, pageSize: req.pageSize },
      scopedWhere,
    );
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap(list.map((u) => u.id));
    return {
      list: list.map((user) => this.toResDTO(user, deptNameMap, profileMap)),
      total,
    };
  }

  /**
   * 获取用户详情列表（按 dataScope 过滤）
   */
  async getUserList(
    ids: number[] | string | number,
    loginUser?: LoginUser,
  ): Promise<UserResDTO[]> {
    const idList = toIntArray(ids);
    if (idList.length === 0) {
      return [];
    }
    const list = await this.userRepository.selectByIds(idList);
    const accessible: typeof list = [];
    for (const user of list) {
      try {
        await this.dataScopeService.assertUserAccessible(loginUser, user);
        accessible.push(user);
      } catch {
        // 跳过数据权限外的用户，避免批量接口泄露
      }
    }
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap(accessible.map((u) => u.id));
    return accessible.map((user) =>
      this.toResDTO(user, deptNameMap, profileMap),
    );
  }

  /**
   * 获取用户精简信息列表（仅启用）
   */
  async getSimpleUserList(
    deptId?: number,
    loginUser?: LoginUser,
  ): Promise<UserSimpleResDTO[]> {
    const where: Record<string, unknown> = { status: 1 };
    if (deptId !== undefined) {
      const deptIds = await this.collectSubDeptIds(deptId);
      if (deptIds.length === 0) {
        return [];
      }
      where.deptId = { in: deptIds };
    }
    const scopedWhere = await this.mergeDataScopeWhere(loginUser, where);
    const list = await this.userRepository.selectList(scopedWhere);
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap(list.map((u) => u.id));
    return list.map((user) => this.toSimpleResDTO(user, deptNameMap, profileMap));
  }

  /**
   * 获取用户详情
   */
  async getUser(id: number, loginUser?: LoginUser): Promise<UserResDTO> {
    const user = await this.userRepository.selectById(id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap([id]);
    return this.toResDTO(user, deptNameMap, profileMap);
  }

  /**
   * 导出用户 Excel（最多 EXCEL_MAX_ROWS 行）
   */
  async exportExcel(loginUser?: LoginUser): Promise<ExcelExportResult> {
    const scopedWhere = await this.mergeDataScopeWhere(loginUser, {});
    const { list } = await this.userRepository.selectPage(
      { page: 1, pageSize: EXCEL_MAX_ROWS },
      scopedWhere ?? {},
    );
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap(list.map((u) => u.id));
    const rows = list.map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        username: user.username,
        nickname: profile?.nickname ?? user.username,
        deptName: user.deptId ? deptNameMap.get(user.deptId) ?? '' : '',
        email: profile?.email ?? '',
        mobile: profile?.mobile ?? '',
        status: user.status === 1 ? xl(ExportError.ENABLED) : xl(ExportError.DISABLED),
        createTime: formatDate(user.createTime),
      };
    });
    return buildExcelExport({
      sheetName: xl(ExportError.USER),
      filename: `${xl(ExportError.USER)}_${Date.now()}.xlsx`,
      columns: [
        { header: xl(ExportError.ID), key: 'id', width: 10 },
        { header: xl(ExportError.USERNAME), key: 'username', width: 18 },
        { header: xl(ExportError.NICKNAME), key: 'nickname', width: 18 },
        { header: xl(ExportError.DEPT), key: 'deptName', width: 16 },
        { header: xl(ExportError.EMAIL), key: 'email', width: 24 },
        { header: xl(ExportError.MOBILE), key: 'mobile', width: 16 },
        { header: xl(ExportError.STATUS), key: 'status', width: 10 },
        { header: xl(ExportError.CREATE_TIME), key: 'createTime', width: 20 },
      ],
      rows,
    });
  }

  /**
   * 获得导入用户模板
   */
  async getImportTemplate(): Promise<ExcelExportResult> {
    return buildExcelExport({
      sheetName: xl(ExportError.USER_IMPORT),
      filename: xl(ExportError.USER_IMPORT_TEMPLATE_FILE),
      columns: [
        { header: xl(ExportError.USERNAME), key: 'username', width: 16 },
        { header: xl(ExportError.NICKNAME), key: 'nickname', width: 16 },
        { header: xl(ExportError.DEPT_ID), key: 'deptId', width: 12 },
        { header: xl(ExportError.EMAIL), key: 'email', width: 24 },
        { header: xl(ExportError.MOBILE), key: 'mobile', width: 16 },
        { header: xl(ExportError.SEX), key: 'sex', width: 12 },
        { header: xl(ExportError.ACCOUNT_STATUS), key: 'status', width: 12 },
      ],
      rows: [
        {
          username: 'demo',
          nickname: '演示用户',
          deptId: '',
          email: 'demo@example.com',
          mobile: '13800000000',
          sex: 1,
          status: 1,
        },
      ],
    });
  }

  /**
   * 导入用户（Excel）
   *
   * 列头：用户账号 / 用户昵称 / 部门编号 / 用户邮箱 / 手机号码 / 用户性别 / 账号状态
   * 新建用户默认密码必须配置环境变量 USER_IMPORT_DEFAULT_PASSWORD。
   */
  async importUser(
    buffer: Buffer,
    updateSupport = false,
    loginUser?: LoginUser,
  ): Promise<UserImportResDTO> {
    if (!buffer || buffer.length === 0) {
      throw new HttpException(UserError.IMPORT_EXCEL_REQUIRED, HttpStatus.BAD_REQUEST);
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    // exceljs 接受 Buffer；类型定义偏严，按运行时能力加载
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new HttpException(UserError.IMPORT_EXCEL_EMPTY, HttpStatus.BAD_REQUEST);
    }

    const headerRow = sheet.getRow(1);
    const headerIndex = new Map<string, number>();
    headerRow.eachCell((cell, col) => {
      const text = excelCellToString(cell.value).trim();
      if (text) headerIndex.set(text, col);
    });
    const col = (name: string) => headerIndex.get(name);

    const createUsernames: string[] = [];
    const updateUsernames: string[] = [];
    const failureUsernames: Record<string, string> = {};
    const tenantId = this.currentTenantId();
    const defaultPassword = process.env.USER_IMPORT_DEFAULT_PASSWORD?.trim();
    if (!defaultPassword) {
      throw new HttpException(
        UserError.IMPORT_DEFAULT_PASSWORD_REQUIRED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    try {
      assertPasswordStrength(defaultPassword, 'USER_IMPORT_DEFAULT_PASSWORD', 12);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : '导入默认密码不合规',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const hashed = await hashPassword(defaultPassword);

    const maxRow = Math.min(sheet.rowCount, EXCEL_MAX_ROWS + 1);
    for (let r = 2; r <= maxRow; r++) {
      const row = sheet.getRow(r);
      const username = excelCellToString(
        row.getCell(col('用户账号') ?? 1).value,
      ).trim();
      if (!username) {
        continue;
      }
      const nickname =
        excelCellToString(row.getCell(col('用户昵称') ?? 2).value).trim() ||
        username;
      const deptRaw = excelCellToString(
        row.getCell(col('部门编号') ?? 3).value,
      ).trim();
      const email = excelCellToString(
        row.getCell(col('用户邮箱') ?? 4).value,
      ).trim();
      const mobile = excelCellToString(
        row.getCell(col('手机号码') ?? 5).value,
      ).trim();
      const sexRaw = excelCellToString(
        row.getCell(col('用户性别') ?? 6).value,
      ).trim();
      const statusRaw = excelCellToString(
        row.getCell(col('账号状态') ?? 7).value,
      ).trim();

      try {
        const deptId = deptRaw !== '' ? Number(deptRaw) : undefined;
        const sex = sexRaw !== '' ? Number(sexRaw) : undefined;
        const status = statusRaw !== '' ? Number(statusRaw) : 1;

        const exists = await this.userRepository.selectByUnique({
          username,
        });
        if (exists) {
          if (!updateSupport) {
            failureUsernames[username] = '账号已存在';
            continue;
          }
          await this.dataScopeService.assertUserAccessible(loginUser, exists);
          const nextDeptId = deptId ?? exists.deptId;
          if (nextDeptId != null && Number.isFinite(Number(nextDeptId))) {
            await this.dataScopeService.assertDeptAccessible(
              loginUser,
              Number(nextDeptId),
            );
          }
          await this.checkEmailMobileUnique(
            email || undefined,
            mobile || undefined,
            exists.id,
          );
          const existingProfile =
            await this.userProfileRepository.selectByUserId(exists.id);
          await this.userRepository.updateById(exists.id, {
            deptId: deptId ?? exists.deptId,
            status: Number.isFinite(status) ? status : exists.status,
          });
          await this.userProfileRepository.upsertByUserId(exists.id, {
            tenantId,
            nickname: nickname || existingProfile?.nickname || username,
            email: email || existingProfile?.email || null,
            mobile: mobile || existingProfile?.mobile || null,
            sex: sex ?? existingProfile?.sex ?? null,
          });
          updateUsernames.push(username);
        } else {
          if (deptId != null && Number.isFinite(deptId)) {
            await this.dataScopeService.assertDeptAccessible(loginUser, deptId);
          }
          await this.tenantPolicyService.assertCanCreateUsers(tenantId, 1);
          await this.checkEmailMobileUnique(
            email || undefined,
            mobile || undefined,
          );
          const userId = await this.userRepository.insert({
            tenantId,
            username,
            password: hashed,
            deptId: deptId && Number.isFinite(deptId) ? deptId : null,
            status: Number.isFinite(status) ? status : 1,
            postIds: [],
            passwordUpdateTime: new Date(),
          });
          await this.userProfileRepository.upsertByUserId(userId, {
            tenantId,
            nickname: nickname || username,
            email: email || null,
            mobile: mobile || null,
            sex: sex !== undefined && Number.isFinite(sex) ? sex : null,
          });
          createUsernames.push(username);
        }
      } catch (err) {
        failureUsernames[username] =
          err instanceof HttpException
            ? String(err.message)
            : err instanceof Error
              ? err.message
              : '导入失败';
      }
    }

    const resp = new UserImportResDTO();
    resp.createUsernames = createUsernames;
    resp.updateUsernames = updateUsernames;
    resp.failureUsernames = failureUsernames;
    return resp;
  }

  /**
   * 获得用户精简信息（登录 + dataScope）
   */
  async getSimpleUser(
    id: number,
    loginUser?: LoginUser,
  ): Promise<UserSimpleResDTO> {
    const user = await this.userRepository.selectById(id);
    if (!user) {
      throw new HttpException(
        UserError.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap([id]);
    return this.toSimpleResDTO(user, deptNameMap, profileMap);
  }

  /**
   * 按昵称模糊搜索用户精简信息（登录 + dataScope）
   */
  async getListByNickname(
    nickname: string,
    loginUser?: LoginUser,
  ): Promise<UserSimpleResDTO[]> {
    const userIds =
      await this.userProfileRepository.selectUserIdsByNicknameContains(
        nickname,
      );
    if (userIds.length === 0) {
      return [];
    }
    const where = await this.mergeDataScopeWhere(loginUser, {
      status: 1,
      id: { in: userIds },
    });
    const list = await this.userRepository.selectList(where);
    const deptNameMap = await this.buildDeptNameMap();
    const profileMap = await this.buildProfileMap(list.map((u) => u.id));
    return list
      .slice(0, 20)
      .map((user) => this.toSimpleResDTO(user, deptNameMap, profileMap));
  }

  /**
   * 校验邮箱/手机号唯一性（排除自身，查资料表）
   */
  private async checkEmailMobileUnique(
    email?: string,
    mobile?: string,
    excludeUserId?: number,
  ): Promise<void> {
    const exclude =
      excludeUserId !== undefined ? { userId: { not: excludeUserId } } : {};
    if (email) {
      const exists = await this.userProfileRepository.selectByUnique({
        email,
        ...exclude,
      });
      if (exists) {
        throw new HttpException(
          UserError.EMAIL_USED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (mobile) {
      const exists = await this.userProfileRepository.selectByUnique({
        mobile,
        ...exclude,
      });
      if (exists) {
        throw new HttpException(
          UserError.PHONE_USED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * 收集某部门及其全部子孙部门编号
   */
  private async collectSubDeptIds(deptId: number): Promise<number[]> {
    const deptList = await this.deptService.getDeptListUnscoped({});
    const result: number[] = [];
    const walk = (parentId: number) => {
      for (const dept of deptList) {
        if (dept.parentId === parentId) {
          result.push(dept.id);
          walk(dept.id);
        }
      }
    };
    result.push(deptId);
    walk(deptId);
    return result;
  }

  private isProtectedAdmin(user: UserDO): boolean {
    return user.username.toLowerCase() === ADMIN_USERNAME;
  }

  /** 自我操作护栏：禁止删除/禁用自己，避免把自己锁在系统外 */
  private assertNotSelf(loginUser: LoginUser | undefined, targetId: number): void {
    if (loginUser?.id === targetId) {
      throw new HttpException(
        UserError.CANNOT_OPERATE_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertProtectedAdminNotDeleted(user: UserDO): void {
    if (this.isProtectedAdmin(user)) {
      throw new HttpException(
        UserError.SUPER_ADMIN_CANNOT_DELETE,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertProtectedAdminStatus(user: UserDO, nextStatus: number): void {
    if (!this.isProtectedAdmin(user) || nextStatus === user.status) {
      return;
    }
    throw new HttpException(
      UserError.SUPER_ADMIN_CANNOT_MODIFY,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * 构建 部门编号 -> 部门名称 映射
   */
  private async buildDeptNameMap(): Promise<Map<number, string>> {
    const deptList = await this.deptService.getDeptListUnscoped({});
    return new Map(deptList.map((dept) => [dept.id, dept.name]));
  }

  private async buildProfileMap(
    userIds: number[],
  ): Promise<Map<number, UserProfileDO>> {
    const profiles = await this.userProfileRepository.selectByUserIds(userIds);
    return new Map(profiles.map((p) => [p.userId, p]));
  }

  /**
   * 用户 DO → ResDTO（资料来自 profile 表）
   */
  private toResDTO(
    user: UserDO,
    deptNameMap: Map<number, string>,
    profileMap: Map<number, UserProfileDO>,
  ): UserResDTO {
    const profile = profileMap.get(user.id);
    const resp = new UserResDTO();
    resp.id = user.id;
    resp.username = user.username;
    resp.nickname = profile?.nickname ?? user.username;
    resp.remark = user.remark ?? undefined;
    resp.deptId = user.deptId ?? undefined;
    resp.deptName =
      user.deptId != null ? deptNameMap.get(user.deptId) : undefined;
    resp.postIds = Array.isArray(user.postIds) ? user.postIds : [];
    resp.email = profile?.email ?? undefined;
    resp.mobile = profile?.mobile ?? undefined;
    resp.sex = profile?.sex ?? undefined;
    resp.avatar = profile?.avatar ?? undefined;
    resp.status = user.status;
    resp.loginIp = user.loginIp ?? '';
    resp.loginDate = user.loginDate ? formatDate(user.loginDate) : '';
    resp.createTime = formatDate(user.createTime);
    return resp;
  }

  /**
   * 用户 DO → SimpleResDTO
   */
  private toSimpleResDTO(
    user: UserDO,
    deptNameMap: Map<number, string>,
    profileMap: Map<number, UserProfileDO>,
  ): UserSimpleResDTO {
    const profile = profileMap.get(user.id);
    const resp = new UserSimpleResDTO();
    resp.id = user.id;
    resp.nickname = profile?.nickname ?? user.username;
    resp.avatar = profile?.avatar ?? undefined;
    resp.sex = profile?.sex ?? undefined;
    resp.deptId = user.deptId ?? undefined;
    resp.deptName =
      user.deptId != null ? deptNameMap.get(user.deptId) : undefined;
    return resp;
  }
}
