import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SocialError } from '@/config/error-messages';
import { SocialClientService } from './socialClient.service';
import { SocialClientPageReqDTO, SocialClientResDTO, SocialClientSaveReqDTO } from './dto/socialClient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * 社交客户端 Controller
 */
@ApiTags('社交客户端')
@Controller()
export class SocialClientController {
  constructor(private readonly socialClientService: SocialClientService) {}

  @Post('create')
  @Permission('system:social-client:create')
  @ApiOperation({ summary: '创建社交客户端' })
  @ApiResponse({ status: 200, description: '创建社交客户端成功，返回社交客户端编号' })
  createSocialClient(@Body() req: SocialClientSaveReqDTO) {
    return this.socialClientService.createSocialClient(req);
  }

  @Put('update')
  @Permission('system:social-client:update')
  @ApiOperation({ summary: '更新社交客户端' })
  @ApiResponse({ status: 200, description: '更新社交客户端成功' })
  updateSocialClient(@Body() req: SocialClientSaveReqDTO) {
    return this.socialClientService.updateSocialClient(req);
  }

  @Delete('delete')
  @Permission('system:social-client:delete')
  @ApiOperation({ summary: '删除社交客户端' })
  @ApiResponse({ status: 200, description: '删除社交客户端成功' })
  deleteSocialClient(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.socialClientService.deleteSocialClient(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:social-client:delete')
  @ApiOperation({ summary: '批量删除社交客户端' })
  @ApiResponse({ status: 200, description: '批量删除社交客户端成功' })
  deleteSocialClientList(
    @Body('ids') ids: number[],
    @Query('ids') idsQuery?: number[],
  ) {
    return this.socialClientService.deleteSocialClientList(
      ids ?? idsQuery ?? [],
    );
  }

  @Get('get')
  @Permission('system:social-client:query')
  @ApiOperation({ summary: '获得社交客户端' })
  @ApiResponse({ status: 200, description: '成功返回社交客户端信息' })
  getSocialClient(@Query('id') id: number) {
    return this.socialClientService.getSocialClient(id);
  }

  @Get('page')
  @Permission('system:social-client:query')
  @ApiOperation({ summary: '获得社交客户端分页' })
  @ApiResponse({ status: 200, description: '成功返回社交客户端分页列表' })
  getSocialClientPage(@Query() req: SocialClientPageReqDTO) {
    return this.socialClientService.getSocialClientPage(req);
  }

  /**
   * 发送订阅消息（用于测试/三方对接）
   *
   * 请求体为自由 JSON 对象，字段约定（详细说明见 Service 方法注释）：
   *   - socialClientId: number 必填 —— 社交客户端 ID（sys_social_client.id）
   *   - touser: string —— 接收人标识（企业微信成员 UserID，企业微信渠道必填）
   *   - content: string —— 消息内容（文本，发送渠道均必填）
   *   - userids: string —— 钉钉接收人 userid 列表（逗号分隔，钉钉渠道必填）
   */
  @Post('send-subscribe-message')
  @Permission('system:social-client:send-subscribe-message')
  @ApiOperation({
    summary: '发送订阅消息', // 用于测试
    description:
      '向指定社交客户端的三方渠道（企业微信/钉钉）发送文本工作通知。' +
      '请求体字段：socialClientId(必填,number,社交客户端ID)；touser(string,企业微信接收人UserID)；' +
      'content(string,消息内容)；userids(string,钉钉接收人userid列表,逗号分隔)。',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['socialClientId'],
      properties: {
        socialClientId: {
          type: 'number',
          description: '社交客户端 ID（必填）',
          example: 1,
        },
        touser: {
          type: 'string',
          description: '接收人标识：企业微信成员 UserID（可多个），企业微信渠道必填',
          example: 'ZhangSan',
        },
        content: {
          type: 'string',
          description: '消息内容（文本），发送渠道均必填',
          example: '您的订单已发货，请注意查收',
        },
        userids: {
          type: 'string',
          description: '钉钉接收人 userid 列表（多个用逗号分隔），钉钉渠道必填',
          example: 'zhangsan,lisi',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '发送订阅消息成功' })
  sendSubscribeMessage(@Body() req: Record<string, any>) {
    // 基础字段校验：socialClientId 必填且为数字（详细校验在三方分支内完成）
    const socialClientId = req?.socialClientId;
    if (
      socialClientId === undefined ||
      socialClientId === null ||
      Number.isNaN(Number(socialClientId))
    ) {
      throw new HttpException(
        SocialError.CLIENT_ID_PARAM_REQUIRED,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.socialClientService.sendSubscribeMessage(req);
  }
}
