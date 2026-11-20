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
import { ErrorCodeService } from './errorCode.service';
import {
  ErrorCodePageReqDTO,
  ErrorCodeResDTO,
  ErrorCodeSaveReqDTO,
} from './dto/errorCode.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';
import { OperateLog } from '@/common/decorator/operate-log.decorator';

@ApiTags('错误码管理')
@Controller()
export class ErrorCodeController {
  constructor(private readonly service: ErrorCodeService) {}

  @Post('create')
  @Permission('system:error-code:create')
  @OperateLog({ type: OpLogType.ERROR_CODE, subType: OpLogSub.CREATE })
  @ApiOperation({ summary: '创建错误码' })
  create(@Body() req: ErrorCodeSaveReqDTO) {
    return this.service.create(req);
  }

  @Put('update')
  @Permission('system:error-code:update')
  @OperateLog({ type: OpLogType.ERROR_CODE, subType: OpLogSub.UPDATE })
  @ApiOperation({ summary: '更新错误码' })
  update(@Body() req: ErrorCodeSaveReqDTO) {
    return this.service.update(req);
  }

  @Delete('delete')
  @Permission('system:error-code:delete')
  @OperateLog({ type: OpLogType.ERROR_CODE, subType: OpLogSub.DELETE })
  @ApiOperation({ summary: '删除错误码' })
  delete(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.service.delete(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:error-code:delete')
  @OperateLog({ type: OpLogType.ERROR_CODE, subType: OpLogSub.DELETE_BATCH })
  @ApiOperation({ summary: '批量删除错误码' })
  deleteList(
    @Body('ids') ids: number[],
    @Query('ids') idsQuery?: number[],
  ) {
    return this.service.deleteList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:error-code:query')
  @ApiOperation({ summary: '获得错误码' })
  @ApiResponse({ status: 200, type: ErrorCodeResDTO })
  get(@Query('id') id: number) {
    return this.service.get(id);
  }

  @Get('page')
  @Permission('system:error-code:query')
  @ApiOperation({ summary: '错误码分页' })
  page(@Query() query: ErrorCodePageReqDTO) {
    return this.service.page(query);
  }
}
