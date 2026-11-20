import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { Permission } from '@/common/decorator/permission.decorator';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import type { LoginUser as LoginUserType } from '@/common/decorator/login-user.decorator';
import { DeptError, UserError } from '@/config/error-messages';
import { TenantContext } from '@/common/tenant/tenant.context';
import { DataScopeService } from '@/modules/permission/permission/data-scope.service';
import { isUserInDataScope } from '@/modules/permission/permission/data-scope.filter';
import {
  resolveDeptDeletionBlocker,
  roleReferencesDept,
} from '@/modules/dept/dept/dept-deletion.util';
import { resolveId } from '@/utils/resolve-id';
import {
  HttpContractTokenService,
  memoryDeptRepository,
  memoryPrisma,
} from './fakes';
import { httpContractWorld } from './world';

@Controller('user')
export class HttpContractUserController {
  constructor(
    @Inject(DataScopeService)
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get('page')
  @Permission('system:user:query')
  async page(@LoginUser() loginUser: LoginUserType) {
    const tenantId = TenantContext.getTenantId();
    const scope = await this.dataScopeService.resolveForUser(loginUser);
    const list = httpContractWorld.users.filter((u) => {
      if (tenantId && u.tenantId !== tenantId) return false;
      return isUserInDataScope(scope, u);
    });
    return {
      list: list.map((u) => ({ id: u.id, username: u.username })),
      total: list.length,
    };
  }

  @Get('get')
  @Permission('system:user:query')
  async get(
    @Query('id', ParseIntPipe) id: number,
    @LoginUser() loginUser: LoginUserType,
  ) {
    const tenantId = TenantContext.getTenantId();
    const user = httpContractWorld.user(id);
    if (!user || (tenantId && user.tenantId !== tenantId)) {
      throw new HttpException(UserError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.dataScopeService.assertUserAccessible(loginUser, user);
    return { id: user.id, username: user.username };
  }
}

@Controller('dept')
export class HttpContractDeptController {
  constructor(
    @Inject(DataScopeService)
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Delete('delete')
  @Permission('system:dept:delete')
  async deleteDept(
    @Body('id') bodyId: number | undefined,
    @Query('id') queryId: number | undefined,
    @LoginUser() loginUser: LoginUserType,
  ) {
    const id = resolveId(bodyId, queryId);
    const dept = await memoryDeptRepository.selectById(id);
    if (!dept) {
      throw new HttpException(DeptError.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.dataScopeService.assertDeptAccessible(loginUser, id);
    const children = await memoryDeptRepository.selectByUnique({ parentId: id });
    const userCount = await memoryPrisma.sysUser.count({
      where: { deptId: id },
    });
    const roles = await memoryPrisma.sysRole.findMany();
    const blocker = resolveDeptDeletionBlocker({
      hasChildren: !!children,
      userCount,
      referencedByRole: roles.some((r) =>
        roleReferencesDept(r.dataScopeDeptIds, id),
      ),
    });
    if (blocker) {
      throw new HttpException(DeptError[blocker], HttpStatus.BAD_REQUEST);
    }
    return memoryDeptRepository.deleteById(id);
  }
}

@Controller('oauth2-token')
export class HttpContractTokenController {
  constructor(
    @Inject(HttpContractTokenService)
    private readonly tokenService: HttpContractTokenService,
  ) {}

  @Put('force-logout')
  @Permission('system:oauth2-token:delete')
  forceLogout(
    @Body('userId', ParseIntPipe) userId: number,
    @Body('userType') userType?: number,
  ) {
    return this.tokenService.forceLogoutByUserId(userId, userType);
  }
}

@Controller('user-profile')
export class HttpContractProfileController {
  @Get('get')
  get(@LoginUser() loginUser: LoginUserType) {
    return { id: loginUser.id, tenantId: loginUser.tenantId };
  }
}
