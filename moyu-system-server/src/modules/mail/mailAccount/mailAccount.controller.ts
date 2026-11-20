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
import { MailAccountService } from './mailAccount.service';
import {
  MailAccountPageReqDTO,
  MailAccountResDTO,
  MailAccountSaveReqDTO,
  MailAccountSimpleResDTO,
} from './dto/mailAccount.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 邮箱账号 Controller
 */
@ApiTags('邮箱账号')
@Controller()
export class MailAccountController {
  constructor(private readonly mailAccountService: MailAccountService) {}

  @Post('create')
  @Permission('system:mail-account:create')
  @ApiOperation({ summary: '创建邮箱账号' })
  @ApiResponse({ status: 200, description: '创建邮箱账号成功，返回邮箱账号编号' })
  createMailAccount(@Body() req: MailAccountSaveReqDTO) {
    return this.mailAccountService.createMailAccount(req);
  }

  @Put('update')
  @Permission('system:mail-account:update')
  @ApiOperation({ summary: '修改邮箱账号' })
  @ApiResponse({ status: 200, description: '修改邮箱账号成功' })
  updateMailAccount(@Body() req: MailAccountSaveReqDTO) {
    return this.mailAccountService.updateMailAccount(req);
  }

  @Delete('delete')
  @Permission('system:mail-account:delete')
  @ApiOperation({ summary: '删除邮箱账号' })
  @ApiResponse({ status: 200, description: '删除邮箱账号成功' })
  deleteMailAccount(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.mailAccountService.deleteMailAccount(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:mail-account:delete')
  @ApiOperation({ summary: '批量删除邮箱账号' })
  @ApiResponse({ status: 200, description: '批量删除邮箱账号成功' })
  deleteMailAccountList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.mailAccountService.deleteMailAccountList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:mail-account:query')
  @ApiOperation({ summary: '获得邮箱账号' })
  @ApiResponse({ status: 200, description: '获取邮箱账号成功' })
  getMailAccount(@Query('id') id: number) {
    return this.mailAccountService.getMailAccount(id);
  }

  @Get('page')
  @Permission('system:mail-account:query')
  @ApiOperation({ summary: '获得邮箱账号分页列表' })
  @ApiResponse({ status: 200, description: '获取邮箱账号分页列表成功' })
  getMailAccountPage(@Query() req: MailAccountPageReqDTO) {
    return this.mailAccountService.getMailAccountPage(req);
  }

  @Get('simple-list')
  @Permission('system:mail-account:query')
  @ApiOperation({ summary: '获取邮箱账号精简列表' })
  @ApiResponse({ status: 200, description: '获取邮箱账号精简列表成功' })
  getSimpleMailAccountList() {
    return this.mailAccountService.getSimpleMailAccountList();
  }
}
