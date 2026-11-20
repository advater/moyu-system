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
import { OperateLogService } from './operateLog.service';
import { OperateLogPageReqDTO, OperateLogResDTO } from './dto/operateLog.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { RawResponse } from '@/common/decorator/auth.decorator';

/**
 * 操作日志 Controller
 */
@ApiTags('操作日志')
@Controller()
export class OperateLogController {
  constructor(private readonly operateLogService: OperateLogService) {}

  @Get('get')
  @Permission('system:operate-log:query')
  @ApiOperation({ summary: '查看操作日志' })
  @ApiResponse({ status: 200, description: '获取操作日志成功' })
  getOperateLog(@Query('id') id: number) {
    return this.operateLogService.getOperateLog(id);
  }

  @Get('page')
  @Permission('system:operate-log:query')
  @ApiOperation({ summary: '查看操作日志分页列表' })
  @ApiResponse({ status: 200, description: '获取操作日志分页列表成功' })
  pageOperateLog(@Query() req: OperateLogPageReqDTO) {
    return this.operateLogService.pageOperateLog(req);
  }

  @Get('export-excel')
  @Permission('system:operate-log:export')
  @RawResponse()
  @ApiOperation({ summary: '获取操作日志excel' })
  @ApiResponse({ status: 200, description: '导出操作日志excel成功' })
  async exportExcel(): Promise<StreamableFile> {
    const file = await this.operateLogService.exportExcel();
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    });
  }
}
