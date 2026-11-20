import { 
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import { TenantPackageService } from './tenantPackage.service';
import { TenantPackagePageReqDTO, TenantPackageResDTO, TenantPackageSaveReqDTO, TenantPackageSimpleResDTO } from './dto/tenantPackage.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { SkipTenantCheck } from '@/common/decorator/auth.decorator';

/**
 * 租户套餐 Controller（平台级）
 */
@ApiTags('租户套餐')
@SkipTenantCheck()
@Controller()
export class TenantPackageController {
  constructor(private readonly tenantPackageService: TenantPackageService) {}

  @Post('create')
  @Permission('system:tenant-package:create')
  @ApiOperation({ summary: '创建租户套餐' })
  @ApiResponse({ status: 200, description: '创建租户套餐成功，返回租户套餐编号' })
  createTenantPackage(@Body() req: TenantPackageSaveReqDTO) {
    return this.tenantPackageService.createTenantPackage(req);
  }

  @Put('update')
  @Permission('system:tenant-package:update')
  @ApiOperation({ summary: '更新租户套餐' })
  @ApiResponse({ status: 200, description: '更新租户套餐成功' })
  updateTenantPackage(@Body() req: TenantPackageSaveReqDTO) {
    return this.tenantPackageService.updateTenantPackage(req);
  }

  @Delete('delete')
  @Permission('system:tenant-package:delete')
  @ApiOperation({ summary: '删除租户套餐' })
  @ApiResponse({ status: 200, description: '删除租户套餐成功' })
  deleteTenantPackage(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.tenantPackageService.deleteTenantPackage(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:tenant-package:delete')
  @ApiOperation({ summary: '批量删除租户套餐' })
  @ApiResponse({ status: 200, description: '批量删除租户套餐成功' })
  deleteTenantPackageList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.tenantPackageService.deleteTenantPackageList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:tenant-package:query')
  @ApiOperation({ summary: '获取租户套餐' })
  @ApiResponse({ status: 200, description: '获取租户套餐成功' })
  getTenantPackage(@Query('id') id: number) {
    return this.tenantPackageService.getTenantPackage(id);
  }

  @Get('page')
  @Permission('system:tenant-package:query')
  @ApiOperation({ summary: '获取租户套餐分页' })
  @ApiResponse({ status: 200, description: '获取租户套餐分页成功' })
  getTenantPackagePage(@Query() query: TenantPackagePageReqDTO) {
    return this.tenantPackageService.getTenantPackagePage(query);
  }

  @Get('simple-list')
  @Permission('system:tenant-package:query')
  @ApiOperation({ summary: '获取租户套餐详情' })
  @ApiResponse({ status: 200, description: '获取租户套餐详情成功' })  
  getSimpleTenantPackageList() {
    return this.tenantPackageService.getSimpleTenantPackageList();
  }

  @Get('list-by-menu-id')
  @Permission('system:tenant-package:query')
  @ApiOperation({ summary: '查询包含指定菜单的套餐（变更影响提示）' })
  listByMenuId(@Query('menuId') menuId: number) {
    return this.tenantPackageService.listPackagesByMenuId(menuId);
  }
}
