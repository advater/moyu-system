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
import { DictTypeService } from './dictType.service';
import {
  DictTypePageReqDTO,
  DictTypeResDTO,
  DictTypeSaveReqDTO,
  DictTypeSimpleResDTO,
} from './dto/dictType.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';

/**
 * 字典类型 Controller
 */
@ApiTags('字典类型')
@Controller()
export class DictTypeController {
  constructor(private readonly dictTypeService: DictTypeService) {}

  @Post('create')
  @Permission('system:dict:create')
  @ApiOperation({ summary: '创建字典类型' })
  @ApiResponse({
    status: 200,
    description: '创建字典类型成功，返回字典类型编号',
  })
  createDictType(@Body() req: DictTypeSaveReqDTO) {
    return this.dictTypeService.createDictType(req);
  }

  @Put('update')
  @Permission('system:dict:update')
  @ApiOperation({ summary: '修改字典类型' })
  @ApiResponse({
    status: 200,
    description: '修改字典类型成功，返回字典类型编号',
  })
  updateDictType(@Body() req: DictTypeSaveReqDTO) {
    return this.dictTypeService.updateDictType(req);
  }

  @Delete('delete')
  @Permission('system:dict:delete')
  @ApiOperation({ summary: '删除字典类型' })
  @ApiResponse({ status: 200, description: '删除字典类型成功' })
  deleteDictType(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.dictTypeService.deleteDictType(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:dict:delete')
  @ApiOperation({ summary: '批量删除字典类型' })
  @ApiResponse({ status: 200, description: '批量删除字典类型列表成功' })
  deleteDictTypeList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.dictTypeService.deleteDictTypeList(ids ?? idsQuery ?? []);
  }

  @Get('page')
  @Permission('system:dict:query')
  @ApiOperation({ summary: '获取字典类型的分页列表' })
  @ApiResponse({ status: 200, description: '获取字典类型分页列表成功' })
  pageDictTypes(@Query() req: DictTypePageReqDTO) {
    return this.dictTypeService.pageDictTypes(req);
  }

  @Get('get')
  @Permission('system:dict:query')
  @ApiOperation({ summary: '查询字典类型详情' })
  @ApiResponse({ status: 200, description: '获取字典类型详情成功' })
  getDictType(@Query('id') id: number) {
    return this.dictTypeService.getDictType(id);
  }

  @Get('simple-list')
  @Permission('system:dict:query')
  @ApiOperation({
    summary: '获取全部字典类型列表',
    description: '包括开启 + 禁用的字典类型，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获取字典类型简单列表成功' })
  getSimpleDictTypeList() {
    return this.dictTypeService.getSimpleDictTypeList();
  }

  @Get('export-excel')
  @Permission('system:dict:export')
  @RawResponse()
  @ApiOperation({ summary: '导出字典类型数据' })
  @ApiResponse({ status: 200, description: '导出字典类型数据Excel文件' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.dictTypeService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
