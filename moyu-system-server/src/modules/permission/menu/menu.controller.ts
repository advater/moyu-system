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
import { MenuService } from './menu.service';
import {
  MenuListReqDTO,
  MenuResDTO,
  MenuSaveDTO,
  MenuSimpleResDTO,
} from './dto/menu.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 菜单 Controller
 */
@ApiTags('菜单')
@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('create')
  @Permission('system:menu:create')
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 200, description: '创建菜单成功，返回菜单编号' })
  createMenu(@Body() req: MenuSaveDTO) {
    return this.menuService.createMenu(req);
  }

  @Put('update')
  @Permission('system:menu:update')
  @ApiOperation({ summary: '修改菜单' })
  @ApiResponse({ status: 200, description: '修改菜单成功' })
  updateMenu(@Body() req: MenuSaveDTO) {
    return this.menuService.updateMenu(req);
  }

  @Delete('delete')
  @Permission('system:menu:delete')
  @ApiOperation({ summary: '删除菜单' })
  @ApiResponse({ status: 200, description: '删除菜单成功' })
  deleteMenu(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.menuService.deleteMenu(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:menu:delete')
  @ApiOperation({ summary: '批量删除菜单' })
  @ApiResponse({ status: 200, description: '批量删除菜单成功' })
  deleteMenuList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.menuService.deleteMenuList(ids ?? idsQuery ?? []);
  }

  @Get('list')
  @Permission('system:menu:query')
  @ApiOperation({
    summary: '获取菜单列表',
    description: '用于【菜单管理】界面',
  })
  @ApiResponse({ status: 200, description: '获取菜单列表成功' })
  getMenuList(@Query() req: MenuListReqDTO) {
    return this.menuService.getMenuList(req);
  }

  @Get('simple-list')
  @Permission('system:menu:query')
  @ApiOperation({
    summary: '获取菜单精简信息列表',
    description:
      '只包含被开启的菜单，用于【角色分配菜单】功能的选项。在多租户的场景下，会只返回租户所在套餐有的菜单',
  })
  @ApiResponse({ status: 200, description: '获取精简菜单信息列表成功' })
  getSimpleMenuList() {
    return this.menuService.getSimpleMenuList();
  }

  @Get('get')
  @Permission('system:menu:query')
  @ApiOperation({ summary: '获取菜单信息' })
  @ApiResponse({ status: 200, description: '获取菜单信息成功' })
  getMenu(@Query('id') id: number) {
    return this.menuService.getMenu(id);
  }
}
