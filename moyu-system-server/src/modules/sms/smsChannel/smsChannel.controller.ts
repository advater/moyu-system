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
import { SmsChannelService } from './smsChannel.service';
import {
  SmsChannelPageReqDTO,
  SmsChannelResDTO,
  SmsChannelSaveReqDTO,
  SmsChannelSimpleResDTO,
} from './dto/smsChannel.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 短信渠道 Controller
 */
@ApiTags('短信渠道')
@Controller()
export class SmsChannelController {
  constructor(private readonly smsChannelService: SmsChannelService) {}

  @Post('create')
  @Permission('system:sms-channel:create')
  @ApiOperation({ summary: '创建短信渠道' })
  @ApiResponse({
    status: 200,
    description: '创建短信渠道成功，返回短信渠道编号',
  })
  createSmsChannel(@Body() req: SmsChannelSaveReqDTO) {
    return this.smsChannelService.createSmsChannel(req);
  }

  @Put('update')
  @Permission('system:sms-channel:update')
  @ApiOperation({ summary: '修改短信渠道' })
  @ApiResponse({ status: 200, description: '修改短信渠道成功' })
  updateSmsChannel(@Body() req: SmsChannelSaveReqDTO) {
    return this.smsChannelService.updateSmsChannel(req);
  }

  @Delete('delete')
  @Permission('system:sms-channel:delete')
  @ApiOperation({ summary: '删除短信渠道' })
  @ApiResponse({ status: 200, description: '删除短信渠道成功' })
  deleteSmsChannel(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.smsChannelService.deleteSmsChannel(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:sms-channel:delete')
  @ApiOperation({ summary: '批量删除短信渠道' })
  @ApiResponse({ status: 200, description: '批量删除短信渠道成功' })
  deleteSmsChannelList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.smsChannelService.deleteSmsChannelList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:sms-channel:query')
  @ApiOperation({ summary: '获得短信渠道' })
  @ApiResponse({ status: 200, description: '获取短信渠道信息成功' })
  getSmsChannel(@Query('id') id: number) {
    return this.smsChannelService.getSmsChannel(id);
  }

  @Get('page')
  @Permission('system:sms-channel:query')
  @ApiOperation({ summary: '获得短信渠道分页列表' })
  @ApiResponse({ status: 200, description: '获取短信渠道分页列表成功' })
  getSmsChannelPage(@Query() req: SmsChannelPageReqDTO) {
    return this.smsChannelService.getSmsChannelPage(req);
  }

  @Get('simple-list')
  @Permission('system:sms-channel:query')
  @ApiOperation({
    summary: '获得短信渠道精简列表',
    description: '包含被禁用的短信渠道',
  })
  @ApiResponse({ status: 200, description: '获取短信渠道精简列表成功' })
  getSimpleSmsChannelList() {
    return this.smsChannelService.getSimpleSmsChannelList();
  }
}
