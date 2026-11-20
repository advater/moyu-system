import { OpLogSub, OpLogType } from '@/config/error-messages';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import {
  ConfigPageReqDTO,
  ConfigResDTO,
  ConfigSaveReqDTO,
  ConfigSimpleResDTO,
} from './dto/config.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';

/**
 * 参数配置 Controller
 */
@ApiTags('参数配置')
@Controller()
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post('create')
  @Permission('system:config:create')
  @OperateLog({ type: OpLogType.CONFIG, subType: OpLogSub.CREATE })
  @ApiOperation({ summary: '创建参数配置' })
  @ApiResponse({ status: 200, description: '创建成功，返回编号' })
  createConfig(@Body() req: ConfigSaveReqDTO) {
    return this.configService.createConfig(req);
  }

  @Put('update')
  @Permission('system:config:update')
  @OperateLog({ type: OpLogType.CONFIG, subType: OpLogSub.UPDATE })
  @ApiOperation({ summary: '修改参数配置' })
  @ApiResponse({ status: 200, description: '修改成功' })
  updateConfig(@Body() req: ConfigSaveReqDTO) {
    return this.configService.updateConfig(req);
  }

  @Delete('delete')
  @Permission('system:config:delete')
  @OperateLog({ type: OpLogType.CONFIG, subType: OpLogSub.DELETE })
  @ApiOperation({ summary: '删除参数配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  deleteConfig(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.configService.deleteConfig(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:config:delete')
  @OperateLog({ type: OpLogType.CONFIG, subType: OpLogSub.DELETE_BATCH })
  @ApiOperation({ summary: '批量删除参数配置' })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  deleteConfigList(
    @Body('ids') ids: number[],
    @Query('ids') idsQuery?: number[],
  ) {
    return this.configService.deleteConfigList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:config:query')
  @ApiOperation({ summary: '获得参数配置' })
  @ApiResponse({ status: 200, type: ConfigResDTO })
  getConfig(@Query('id') id: number) {
    return this.configService.getConfig(id);
  }

  @Get('page')
  @Permission('system:config:query')
  @ApiOperation({ summary: '获得参数配置分页' })
  @ApiResponse({ status: 200, description: '分页列表' })
  getConfigPage(@Query() query: ConfigPageReqDTO) {
    return this.configService.getConfigPage(query);
  }

  @Get('simple-list')
  @Permission('system:config:query')
  @ApiOperation({ summary: '获得可见参数精简列表' })
  @ApiResponse({ status: 200, type: [ConfigSimpleResDTO] })
  getSimpleConfigList() {
    return this.configService.getSimpleConfigList();
  }

  @Get('get-value-by-key')
  @Permission('system:config:query')
  @ApiOperation({ summary: '按键名获得参数值' })
  @ApiResponse({ status: 200, description: '参数值字符串，不存在则为 null' })
  getValueByKey(@Query('key') key: string) {
    return this.configService.getValueByKey(key);
  }
}
