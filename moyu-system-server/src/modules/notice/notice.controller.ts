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
import { NoticeService } from './notice.service';
import {
  NoticePageReqDTO,
  NoticeResDTO,
  NoticeSaveReqDTO,
} from './dto/notice.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 通知 Controller
 */
@ApiTags('通知')
@Controller()
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post('create')
  @Permission('system:notice:create')
  @ApiOperation({ summary: '创建通知公告' })
  @ApiResponse({ status: 200, description: '创建通知公告成功，返回通知公告编号' })
  createNotice(@Body() req: NoticeSaveReqDTO) {
    return this.noticeService.createNotice(req);
  }

  @Put('update')
  @Permission('system:notice:update')
  @ApiOperation({ summary: '修改通知公告' })
  @ApiResponse({ status: 200, description: '更新通知公告成功' })
  updateNotice(@Body() req: NoticeSaveReqDTO) {
    return this.noticeService.updateNotice(req);
  }

  @Delete('delete')
  @Permission('system:notice:delete')
  @ApiOperation({ summary: '删除通知公告' })
  @ApiResponse({ status: 200, description: '删除通知公告成功' })
  deleteNotice(@Query('id') id: number) {
    return this.noticeService.deleteNotice(id);
  }

  @Delete('delete-list')
  @Permission('system:notice:delete')
  @ApiOperation({ summary: '批量删除通知公告' })
  @ApiResponse({ status: 200, description: '批量删除通知公告成功' })
  deleteNoticeList(@Query('ids') ids: number[]) {
    return this.noticeService.deleteNoticeList(ids);
  }

  @Get('page')
  @Permission('system:notice:query')
  @ApiOperation({ summary: '获得通知公告分页列表' })
  @ApiResponse({ status: 200, description: '获取通知公告分页列表成功' })
  getNoticePage(@Query() req: NoticePageReqDTO) {
    return this.noticeService.getNoticePage(req);
  }

  @Get('get')
  @Permission('system:notice:query')
  @ApiOperation({ summary: '获得通知公告' })
  @ApiResponse({ status: 200, description: '获取通知公告成功' })
  getNotice(@Query('id') id: number) {
    return this.noticeService.getNotice(id);
  }

  @Post('push')
  @Permission('system:notice:push')
  @ApiOperation({
    summary: '推送通知公告',
    description: '只发送给 websocket 连接在线的用户',
  })
  @ApiResponse({ status: 200, description: '推送通知公告成功' })
  pushNotice(@Query('id') id: number) {
    return this.noticeService.pushNotice(id);
  }
}
