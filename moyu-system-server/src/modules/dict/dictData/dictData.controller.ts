import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { DictDataService } from './dictData.service';
import {
  DictDataPageReqDTO,
  DictDataResDTO,
  DictDataSaveReqDTO,
  DictDataSimpleResDTO,
} from './dto/dictData.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * 字典数据 Controller
 */
@ApiTags('字典数据')
@Controller()
export class DictDataController {
  constructor(private readonly dictDataService: DictDataService) {}

  @Post('create')
  @Permission('system:dict:create')
  @ApiOperation({ summary: '新增字典数据' })
  @ApiResponse({ status: 200, description: '新增字典数据成功编号' })
  createDictData(@Body() req: DictDataSaveReqDTO) {
    return this.dictDataService.createDictData(req);
  }

  @Put('update')
  @Permission('system:dict:update')
  @ApiOperation({ summary: '修改字典数据' })
  @ApiResponse({ status: 200, description: '更新字典数据成功' })
  updateDictData(@Body() req: DictDataSaveReqDTO) {
    return this.dictDataService.updateDictData(req);
  }

  @Delete('delete')
  @Permission('system:dict:delete')
  @ApiOperation({ summary: '删除字典数据' })
  @ApiResponse({ status: 200, description: '删除字典数据成功' })
  deleteDictData(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.dictDataService.deleteDictData(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:dict:delete')
  @ApiOperation({ summary: '批量删除字典数据列表' })
  @ApiResponse({ status: 200, description: '批量删除字典数据列表成功' })
  deleteDictDataList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.dictDataService.deleteDictDataList(ids ?? idsQuery ?? []);
  }

  @Get('simple-list')
  @SkipThrottle()
  // 登录即可：全局字典缓存，所有后台页面都依赖，不限制 system:dict:query
  @ApiOperation({
    summary: '获取字典数据简单列表',
    description: '一般用于管理后台缓存字典数据在本地',
  })
  @ApiResponse({ status: 200, description: '获取字典数据简单列表成功' })
  getSimpleDictDataList() {
    return this.dictDataService.getSimpleDictDataList();
  }

  @Get('list-by-types')
  @SkipThrottle()
  // 登录即可：按类型拉字典，供业务页使用，不限制 system:dict:query
  @ApiOperation({
    summary: '按字典类型批量拉取（Redis 缓存）',
    description: 'Query dictTypes=type1,type2 或多次 dictTypes',
  })
  getDictDataListByTypes(
    @Query('dictTypes') dictTypes?: string | string[],
  ) {
    const raw = Array.isArray(dictTypes)
      ? dictTypes.join(',')
      : dictTypes || '';
    const types = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return this.dictDataService.getDictDataListByTypes(types);
  }

  @Get('page')
  @Permission('system:dict:query')
  @ApiOperation({ summary: '获取字典类型的分页列表' })
  @ApiResponse({ status: 200, description: '获取字典类型分页列表成功' })
  getDictTypePage(@Query() req: DictDataPageReqDTO) {
    return this.dictDataService.getDictTypePage(req);
  }

  @Get('get')
  @Permission('system:dict:query')
  @ApiOperation({ summary: '查询字典数据详细' })
  @ApiResponse({ status: 200, description: '查询字典数据详细成功' })
  getDictData(@Query('id') id: number) {
    return this.dictDataService.getDictData(id);
  }

  @Get('export-excel')
  @Permission('system:dict:export')
  @RawResponse()
  @ApiOperation({ summary: '导出字典数据' })
  @ApiResponse({ status: 200, description: '导出字典数据成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.dictDataService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
