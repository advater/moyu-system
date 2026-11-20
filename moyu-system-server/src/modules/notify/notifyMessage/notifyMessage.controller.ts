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
import { NotifyMessageService } from './notifyMessage.service';
import { LoginUser } from '@/common/decorator/login-user.decorator';
import {
  NotifyMessageMyPageReqDTO,
  NotifyMessagePageReqDTO,
  NotifyMessageResDTO,
  NotifyMessageUnreadListReqDTO,
} from './dto/notifyMessage.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 站内信 Controller
 */
@ApiTags('站内信')
@Controller()
export class NotifyMessageController {
  constructor(private readonly notifyMessageService: NotifyMessageService) {}

  @Get('get')
  @Permission('system:notify-message:query')
  @ApiOperation({ summary: '获得站内信' })
  @ApiResponse({ status: 200, description: '获取站内信信息成功' })
  getNotifyMessage(@Query('id') id: number) {
    return this.notifyMessageService.getNotifyMessage(id);
  }

  @Get('page')
  @Permission('system:notify-message:query')
  @ApiOperation({ summary: '获得站内信分页' })
  @ApiResponse({ status: 200, description: '获取站内信分页成功' })
  getNotifyMessagePage(@Query() req: NotifyMessagePageReqDTO) {
    return this.notifyMessageService.getNotifyMessagePage(req);
  }

  // ========== 查看自己的站内信 ==========
  @Get('my-page')
  @ApiOperation({ summary: '获得我的站内信分页' })
  @ApiResponse({ status: 200, description: '获取我的站内信分页成功' })
  getMyNotifyMessagePage(
    @LoginUser() loginUser: LoginUser,
    @Query() req: NotifyMessageMyPageReqDTO,
  ) {
    return this.notifyMessageService.getMyNotifyMessagePage(
      req,
      loginUser.id,
      loginUser.userType,
    );
  }

  @Put('update-read')
  @ApiOperation({ summary: '标记站内信为已读' })
  @ApiResponse({ status: 200, description: '标记站内信为已读成功' })
  updateNotifyMessageRead(
    @LoginUser() loginUser: LoginUser,
    @Query('ids') ids: number[],
  ) {
    return this.notifyMessageService.updateNotifyMessageRead(
      ids,
      loginUser.id,
      loginUser.userType,
    );
  }

  @Put('update-all-read')
  @ApiOperation({ summary: '标记所有站内信为已读' })
  @ApiResponse({ status: 200, description: '标记所有站内信为已读成功' })
  updateAllNotifyMessageRead(@LoginUser() loginUser: LoginUser) {
    return this.notifyMessageService.updateAllNotifyMessageRead(
      loginUser.id,
      loginUser.userType,
    );
  }

  @Get('get-unread-list')
  @ApiOperation({ summary: '获取当前用户的最新站内信列表，默认 10 条' })
  @ApiResponse({ status: 200, description: '获取最新站内信列表成功' })
  getUnreadNotifyMessageList(
    @LoginUser() loginUser: LoginUser,
    @Query() query: NotifyMessageUnreadListReqDTO,
  ) {
    return this.notifyMessageService.getUnreadNotifyMessageList(
      query.size,
      loginUser.id,
      loginUser.userType,
    );
  }

  @Get('get-unread-count')
  @ApiOperation({ summary: '获得当前用户的未读站内信数量' })
  @ApiResponse({ status: 200, description: '获取未读站内信数量成功' })
  getUnreadNotifyMessageCount(@LoginUser() loginUser: LoginUser) {
    return this.notifyMessageService.getUnreadNotifyMessageCount(
      loginUser.id,
      loginUser.userType,
    );
  }
}
