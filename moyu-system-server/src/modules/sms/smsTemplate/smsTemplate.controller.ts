import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { SmsTemplateService } from './smsTemplate.service';
import {
  SmsTemplatePageReqDTO,
  SmsTemplateResDTO,
  SmsTemplateSaveReqDTO,
  SmsTemplateSendReqDTO,
  SmsTemplateSimpleResDTO,
} from './dto/smsTemplate.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';

/**
 * 短信模板 Controller
 */
@ApiTags('短信模板')
@Controller()
export class SmsTemplateController {
  constructor(private readonly smsTemplateService: SmsTemplateService) {}

  @Post('create')
  @Permission('system:sms-template:create')
  @ApiOperation({ summary: '创建短信模板' })
  @ApiResponse({
    status: 200,
    description: '创建短信模板成功，返回短信模板编号',
  })
  createSmsTemplate(@Body() req: SmsTemplateSaveReqDTO) {
    return this.smsTemplateService.createSmsTemplate(req);
  }

  @Put('update')
  @Permission('system:sms-template:update')
  @ApiOperation({ summary: '修改短信模板' })
  @ApiResponse({ status: 200, description: '修改短信模板成功' })
  updateSmsTemplate(@Body() req: SmsTemplateSaveReqDTO) {
    return this.smsTemplateService.updateSmsTemplate(req);
  }

  @Delete('delete')
  @Permission('system:sms-template:delete')
  @ApiOperation({ summary: '删除短信模板' })
  @ApiResponse({ status: 200, description: '删除短信模板成功' })
  deleteSmsTemplate(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.smsTemplateService.deleteSmsTemplate(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:sms-template:delete')
  @ApiOperation({ summary: '批量删除短信模板' })
  @ApiResponse({ status: 200, description: '批量删除短信模板成功' })
  deleteSmsTemplateList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.smsTemplateService.deleteSmsTemplateList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:sms-template:query')
  @ApiOperation({ summary: '获得短信模板' })
  @ApiResponse({ status: 200, description: '获得短信模板成功' })
  getSmsTemplate(@Query('id') id: number) {
    return this.smsTemplateService.getSmsTemplate(id);
  }

  @Get('page')
  @Permission('system:sms-template:query')
  @ApiOperation({ summary: '获得短信模板分页' })
  @ApiResponse({ status: 200, description: '获得短信模板分页成功' })
  getSmsTemplatePage(@Query() req: SmsTemplatePageReqDTO) {
    return this.smsTemplateService.getSmsTemplatePage(req);
  }

  @Get('simple-list')
  @Permission('system:sms-template:query')
  @ApiOperation({
    summary: '获得短信模板精简列表',
    description: '只包含被开启的短信模板，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获得短信模板精简列表成功' })
  getSimpleSmsTemplateList() {
    return this.smsTemplateService.getSimpleSmsTemplateList();
  }

  @Get('export-excel')
  @Permission('system:sms-template:export')
  @RawResponse()
  @ApiOperation({
    summary: '导出短信模板Excel文件',
  })
  @ApiResponse({ status: 200, description: '导出短信模板Excel文件成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.smsTemplateService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }

  @Post('send-sms')
  @Permission('system:sms-template:send-sms')
  @ApiOperation({ summary: '发送短信' })
  @ApiResponse({ status: 200, description: '发送短信成功' })
  sendSms(
    @Body() req: SmsTemplateSendReqDTO,
    @LoginUser() loginUser: LoginUser,
  ) {
    // 透传当前登录用户，用于在短信日志中记录 userId / userType（可空）
    return this.smsTemplateService.sendSms(req, loginUser);
  }
}
