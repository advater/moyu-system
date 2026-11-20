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
import { LoginLogService } from './loginLog.service';
import { LoginLogPageReqDTO, LoginLogResDTO } from './dto/loginLog.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';

/**
 * 登录日志 Controller
 */
@ApiTags('登录日志')
@Controller()
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @Get('get')
  @Permission('system:login-log:query')
  @ApiOperation({ summary: '获取登录日志' })
  @ApiResponse({ status: 200, description: '获取登录日志成功' })
  getLoginLog(@Query('id') id: number) {
    return this.loginLogService.getLoginLog(id);
  }

  @Get('page')
  @Permission('system:login-log:query')
  @ApiOperation({ summary: '获取登录日志分页列表' })
  @ApiResponse({ status: 200, description: '获取登录日志分页列表成功' })
  getLoginLogPage(@Query() req: LoginLogPageReqDTO) {
    return this.loginLogService.getLoginLogPage(req);
  }

  @Get('export-excel')
  @Permission('system:login-log:export')
  @RawResponse()
  @ApiOperation({ summary: '获取登录日志excel' })
  @ApiResponse({ status: 200, description: '导出登录日志excel成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.loginLogService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
