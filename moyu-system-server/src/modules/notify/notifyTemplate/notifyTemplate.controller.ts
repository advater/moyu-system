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
import { NotifyTemplateService } from './notifyTemplate.service';
import {
  NotifyTemplatePageReqDTO,
  NotifyTemplateResDTO,
  NotifyTemplateSaveReqDTO,
  NotifyTemplateSendReqDTO,
  NotifyTemplateSimpleResDTO,
} from './dto/notifyTemplate.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 站内信模版 Controller
 */
@ApiTags('站内信模版')
@Controller()
export class NotifyTemplateController {
  constructor(private readonly notifyTemplateService: NotifyTemplateService) {}

  @Post('create')
  @Permission('system:notify-template:create')
  @ApiOperation({ summary: '创建站内信模版' })
  @ApiResponse({
    status: 200,
    description: '创建站内信模版成功，返回站内信模版编号',
  })
  createNotifyTemplate(@Body() req: NotifyTemplateSaveReqDTO) {
    return this.notifyTemplateService.createNotifyTemplate(req);
  }

  @Put('update')
  @Permission('system:notify-template:update')
  @ApiOperation({ summary: '修改站内信模版' })
  @ApiResponse({ status: 200, description: '修改站内信模版成功' })
  updateNotifyTemplate(@Body() req: NotifyTemplateSaveReqDTO) {
    return this.notifyTemplateService.updateNotifyTemplate(req);
  }

  @Delete('delete')
  @Permission('system:notify-template:delete')
  @ApiOperation({ summary: '删除站内信模版' })
  @ApiResponse({ status: 200, description: '删除站内信模版成功' })
  deleteNotifyTemplate(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.notifyTemplateService.deleteNotifyTemplate(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:notify-template:delete')
  @ApiOperation({ summary: '批量删除站内信模版' })
  @ApiResponse({ status: 200, description: '批量删除站内信模版成功' })
  deleteNotifyTemplateList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.notifyTemplateService.deleteNotifyTemplateList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:notify-template:query')
  @ApiOperation({ summary: '获得站内信模版信息' })
  @ApiResponse({ status: 200, description: '获取站内信模版信息成功' })
  getNotifyTemplate(@Query('id') id: number) {
    return this.notifyTemplateService.getNotifyTemplate(id);
  }

  @Get('page')
  @Permission('system:notify-template:query')
  @ApiOperation({ summary: '获得站内信模版分页列表' })
  @ApiResponse({ status: 200, description: '获取站内信模版分页列表成功' })
  getNotifyTemplatePage(@Query() req: NotifyTemplatePageReqDTO) {
    return this.notifyTemplateService.getNotifyTemplatePage(req);
  }

  @Get('simple-list')
  @Permission('system:notify-template:query')
  @ApiOperation({
    summary: '获取站内信模版精简列表',
    description: '只包含被开启的站内信模版，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获取站内信模版精简列表成功' })
  getSimpleNotifyTemplateList() {
    return this.notifyTemplateService.getSimpleNotifyTemplateList();
  }

  @Post('send-notify')
  @Permission('system:notify-template:send-notify')
  @ApiOperation({ summary: '发送站内信' })
  @ApiResponse({ status: 200, description: '发送站内信成功，返回站内信编号' })
  sendNotify(@Body() req: NotifyTemplateSendReqDTO) {
    return this.notifyTemplateService.sendNotify(req);
  }
}
