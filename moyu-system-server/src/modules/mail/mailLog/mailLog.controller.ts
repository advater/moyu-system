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
import { MailLogService } from './mailLog.service';
import { MailLogPageReqDTO, MailLogResDTO } from './dto/mailLog.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 邮件日志 Controller
 */
@ApiTags('邮件日志')
@Controller()
export class MailLogController {
  constructor(private readonly mailLogService: MailLogService) {}

  @Get('page')
  @Permission('system:mail-log:query')
  @ApiOperation({ summary: '获得邮件日志分页列表' })
  @ApiResponse({ status: 200, description: '获取邮件日志分页列表成功' })
  getMailLogPage(@Query() req: MailLogPageReqDTO) {
    return this.mailLogService.getMailLogPage(req);
  }

  @Get('get')
  @Permission('system:mail-log:query')
  @ApiOperation({ summary: '获得邮件日志信息' })
  @ApiResponse({ status: 200, description: '获取邮件日志信息成功' })
  getMailLogInfo(@Query('id') id: number) {
    return this.mailLogService.getMailLogInfo(id);
  }
}
