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
import { MailTemplateService } from './mailTemplate.service';
import {
  MailTemplatePageReqDTO,
  MailTemplateResDTO,
  MailTemplateSaveReqDTO,
  MailTemplateSendReqDTO,
  MailTemplateSimpleResDTO,
} from './dto/mailTemplate.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 邮件模版 Controller
 */
@ApiTags('邮件模版')
@Controller()
export class MailTemplateController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Post('create')
  @Permission('system:mail-template:create')
  @ApiOperation({ summary: '创建邮件模版' })
  @ApiResponse({ status: 200, description: '创建邮件模版成功，返回邮件模版编号' })
  createMailTemplate(@Body() req: MailTemplateSaveReqDTO) {
    return this.mailTemplateService.createMailTemplate(req);
  }

  @Put('update')
  @Permission('system:mail-template:update')
  @ApiOperation({ summary: '修改邮件模版' })
  @ApiResponse({ status: 200, description: '更新邮件模版成功' })
  updateMailTemplate(@Body() req: MailTemplateSaveReqDTO) {
    return this.mailTemplateService.updateMailTemplate(req);
  }

  @Delete('delete')
  @Permission('system:mail-template:delete')
  @ApiOperation({ summary: '删除邮件模版' })
  @ApiResponse({ status: 200, description: '删除邮件模版成功' })
  deleteMailTemplate(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.mailTemplateService.deleteMailTemplate(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:mail-template:delete')
  @ApiOperation({ summary: '批量删除邮件模版' })
  @ApiResponse({ status: 200, description: '批量删除邮件模版成功' })
  deleteMailTemplateList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.mailTemplateService.deleteMailTemplateList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:mail-template:query')
  @ApiOperation({ summary: '获得邮件模版信息' })
  @ApiResponse({ status: 200, description: '获取邮件模版信息成功' })
  getMailTemplate(@Query('id') id: number) {
    return this.mailTemplateService.getMailTemplate(id);
  }

  @Get('page')
  @Permission('system:mail-template:query')
  @ApiOperation({ summary: '获得邮件模版分页列表' })
  @ApiResponse({ status: 200, description: '获取邮件模版分页列表成功' })
  getMailTemplatePage(@Query() req: MailTemplatePageReqDTO) {
    return this.mailTemplateService.getMailTemplatePage(req);
  }

  @Get('simple-list')
  @Permission('system:mail-template:query')
  @ApiOperation({
    summary: '获取邮件模版精简列表',
    description: '只包含被开启的邮件模版，主要用于前端的下拉选项',
  })
  @ApiResponse({ status: 200, description: '获取邮件模版精简列表成功' })
  getSimpleMailTemplateList() {
    return this.mailTemplateService.getSimpleMailTemplateList();
  }

  @Post('send-mail')
  @Permission('system:mail-template:send-mail')
  @ApiOperation({ summary: '按模版发送邮件' })
  @ApiResponse({ status: 200, description: '发送邮件成功，返回邮件日志编号' })
  sendMail(
    @LoginUser() loginUser: LoginUser,
    @Body() req: MailTemplateSendReqDTO,
  ) {
    return this.mailTemplateService.sendMail(req, loginUser);
  }
}
