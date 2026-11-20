import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  StreamableFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OpLogSub, OpLogType, TenantError } from '@/config/error-messages';
import { Throttle } from '@nestjs/throttler';
import { TenantService } from './tenant.service';
import {
  TenantPageReqDTO,
  TenantSaveReqDTO,
} from './dto/tenant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import {
  SkipAuth,
  SkipTenantCheck,
  RawResponse,
} from '@/common/decorator/auth.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';
import { CaptchaService } from '@/modules/captcha/captcha.service';
import { resolveId, resolveIds } from '@/utils/resolve-id';

/**
 * 租户管理 Controller（平台级，默认跳过租户数据隔离）
 */
@ApiTags('租户管理')
@SkipTenantCheck()
@Controller()
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly captchaService: CaptchaService,
  ) {}

  /** 匿名探测是否强制验证码：生产默认开；开发默认关（TENANT_PROBE_CAPTCHA 可覆盖） */
  private async assertProbeCaptcha(
    captchaUuid?: string,
    captchaCode?: string,
  ): Promise<void> {
    const raw = process.env.TENANT_PROBE_CAPTCHA;
    const enabled =
      raw === undefined || raw === ''
        ? process.env.NODE_ENV === 'production'
        : raw !== 'false' && raw !== '0';
    if (!enabled) return;
    if (!captchaUuid?.trim() || !captchaCode?.trim()) {
      throw new HttpException(
        TenantError.PROBE_CAPTCHA_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.captchaService.check({
      uuid: captchaUuid.trim(),
      code: captchaCode.trim(),
    });
  }

  @Get('get-id-by-name')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiQuery({ name: 'captchaUuid', required: false })
  @ApiQuery({ name: 'captchaCode', required: false })
  @ApiOperation({
    summary: '使用租户名，获得租户编号',
    description: '登录界面；生产默认需验证码（开发默认关，可用 TENANT_PROBE_CAPTCHA 覆盖）',
  })
  @ApiResponse({ status: 200, description: '获得租户编号成功' })
  async getTenantIdByName(
    @Query('name') name: string,
    @Query('captchaUuid') captchaUuid?: string,
    @Query('captchaCode') captchaCode?: string,
  ) {
    await this.assertProbeCaptcha(captchaUuid, captchaCode);
    return this.tenantService.getTenantIdByName(name);
  }

  @Get('simple-list')
  @SkipAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiQuery({ name: 'captchaUuid', required: false })
  @ApiQuery({ name: 'captchaCode', required: false })
  @ApiOperation({
    summary: '获取租户精简信息列表',
    description: '开发默认不强制验证码；生产默认需验证码',
  })
  @ApiResponse({ status: 200, description: '获得租户精简信息列表成功' })
  async getTenantSimpleList(
    @Query('captchaUuid') captchaUuid?: string,
    @Query('captchaCode') captchaCode?: string,
  ) {
    await this.assertProbeCaptcha(captchaUuid, captchaCode);
    return this.tenantService.getTenantSimpleList();
  }

  @Get('get-by-website')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiQuery({ name: 'captchaUuid', required: false })
  @ApiQuery({ name: 'captchaCode', required: false })
  @ApiOperation({
    summary: '使用域名，获得租户信息',
    description: '按域名解析租户；开发默认不强制验证码',
  })
  @ApiResponse({ status: 200, description: '获得租户信息成功' })
  async getTenantByWebsite(
    @Query('website') website: string,
    @Query('captchaUuid') captchaUuid?: string,
    @Query('captchaCode') captchaCode?: string,
  ) {
    await this.assertProbeCaptcha(captchaUuid, captchaCode);
    return await this.tenantService.getTenantByWebsite(website);
  }

  @Post('create')
  @Permission('system:tenant:create')
  @OperateLog({ type: OpLogType.TENANT, subType: OpLogSub.TENANT_CREATE })
  @ApiOperation({ summary: '创建租户' })
  @ApiResponse({ status: 200, description: '创建租户成功，返回租户编号' })
  createTenant(@Body() req: TenantSaveReqDTO) {
    return this.tenantService.createTenant(req);
  }

  @Put('update')
  @Permission('system:tenant:update')
  @OperateLog({ type: OpLogType.TENANT, subType: OpLogSub.TENANT_UPDATE })
  @ApiOperation({ summary: '更新租户' })
  @ApiResponse({ status: 200, description: '更新租户成功' })
  updateTenant(@Body() req: TenantSaveReqDTO) {
    return this.tenantService.updateTenant(req);
  }

  @Delete('delete')
  @Permission('system:tenant:delete')
  @OperateLog({ type: OpLogType.TENANT, subType: OpLogSub.TENANT_DELETE })
  @ApiOperation({ summary: '删除租户（Body.id 优先，Query 兼容）' })
  @ApiResponse({ status: 200, description: '删除租户成功' })
  deleteTenant(@Body('id') bodyId?: number, @Query('id') queryId?: number) {
    return this.tenantService.deleteTenant(resolveId(bodyId, queryId));
  }

  @Delete('delete-list')
  @Permission('system:tenant:delete')
  @OperateLog({ type: OpLogType.TENANT, subType: OpLogSub.TENANT_DELETE_BATCH })
  @ApiOperation({ summary: '批量删除租户（Body.ids 优先）' })
  @ApiResponse({ status: 200, description: '批量删除租户成功' })
  deleteTenantList(
    @Body('ids') bodyIds?: number[],
    @Query('ids') queryIds?: number[],
  ) {
    return this.tenantService.deleteTenantList(resolveIds(bodyIds, queryIds));
  }

  @Get('get')
  @Permission('system:tenant:query')
  @ApiOperation({ summary: '获得租户' })
  @ApiResponse({ status: 200, description: '获得租户成功' })
  getTenant(@Query('id') id: number) {
    return this.tenantService.getTenant(id);
  }

  @Get('page')
  @Permission('system:tenant:query')
  @ApiOperation({ summary: '获得租户分页' })
  @ApiResponse({ status: 200, description: '获得租户分页成功' })
  getTenantPage(@Query() req: TenantPageReqDTO) {
    return this.tenantService.getTenantPage(req);
  }

  @Get('export-excel')
  @Permission('system:tenant:export')
  @RawResponse()
  @ApiOperation({
    summary: '导出租户Excel文件',
  })
  @ApiResponse({ status: 200, description: '导出租户Excel文件成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.tenantService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
