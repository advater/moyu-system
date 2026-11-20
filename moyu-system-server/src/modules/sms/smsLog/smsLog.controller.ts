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
import { SmsLogService } from './smsLog.service';
import { SmsLogPageReqDTO, SmsLogResDTO } from './dto/smsLog.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';

/**
 * 短信日志 Controller
 */
@ApiTags('短信日志')
@Controller()
export class SmsLogController {
  constructor(private readonly smsLogService: SmsLogService) {}

  @Get('page')
  @Permission('system:sms-log:query')
  @ApiOperation({ summary: '获得短信日志分页列表' })
  @ApiResponse({ status: 200, description: '获取短信日志分页列表成功' })
  getSmsLogPage(@Query() req: SmsLogPageReqDTO) {
    return this.smsLogService.getSmsLogPage(req);
  }

  @Get('get')
  @Permission('system:sms-log:query')
  @ApiOperation({ summary: '获得短信日志' })
  @ApiResponse({ status: 200, description: '获取短信日志成功' })
  getSmsLog(@Query('id') id: number) {
    return this.smsLogService.getSmsLog(id);
  }

  @Get('export-excel')
  @Permission('system:sms-log:export')
  @RawResponse()
  @ApiOperation({
    summary: '导出短信日志Excel文件',
  })
  @ApiResponse({ status: 200, description: '导出短信日志Excel文件成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.smsLogService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
