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
import { OAuth2ClientService } from './oauth2Client.service';
import {
  OAuth2ClientPageReqDTO,
  OAuth2ClientResDTO,
  OAuth2ClientSaveReqDTO,
} from './dto/oauth2Client.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/common/decorator/permission.decorator';

/**
 * OAuth2 客户端 Controller
 */
@ApiTags('OAuth2 客户端')
@Controller()
export class OAuth2ClientController {
  constructor(private readonly oauth2ClientService: OAuth2ClientService) {}

  @Post('create')
  @Permission('system:oauth2-client:create')
  @ApiOperation({ summary: '创建 OAuth2 客户端' })
  @ApiResponse({ status: 200, description: '创建 OAuth2 客户端成功，返回客户端编号' })
  createOAuth2Client(@Body() req: OAuth2ClientSaveReqDTO) {
    return this.oauth2ClientService.createOAuth2Client(req);
  }

  @Put('update')
  @Permission('system:oauth2-client:update')
  @ApiOperation({ summary: '修改 OAuth2 客户端' })
  @ApiResponse({ status: 200, description: '修改 OAuth2 客户端成功' })
  updateOAuth2Client(@Body() req: OAuth2ClientSaveReqDTO) {
    return this.oauth2ClientService.updateOAuth2Client(req);
  }

  @Delete('delete')
  @Permission('system:oauth2-client:delete')
  @ApiOperation({ summary: '删除 OAuth2 客户端' })
  @ApiResponse({ status: 200, description: '删除 OAuth2 客户端成功' })
  deleteOAuth2Client(@Body('id') id: number, @Query('id') idQuery?: number) {
    return this.oauth2ClientService.deleteOAuth2Client(id ?? idQuery!);
  }

  @Delete('delete-list')
  @Permission('system:oauth2-client:delete')
  @ApiOperation({ summary: '批量删除 OAuth2 客户端' })
  @ApiResponse({ status: 200, description: '批量删除 OAuth2 客户端成功' })
  deleteOAuth2ClientList(@Body('ids') ids: number[], @Query('ids') idsQuery?: number[]) {
    return this.oauth2ClientService.deleteOAuth2ClientList(ids ?? idsQuery ?? []);
  }

  @Get('get')
  @Permission('system:oauth2-client:query')
  @ApiOperation({ summary: '获得 OAuth2 客户端' })
  @ApiResponse({ status: 200, description: '获取 OAuth2 客户端信息成功' })
  getOAuth2Client(@Query('id') id: number) {
    return this.oauth2ClientService.getOAuth2Client(id);
  }

  @Get('page')
  @Permission('system:oauth2-client:query')
  @ApiOperation({ summary: '获得 OAuth2 客户端分页' })
  @ApiResponse({ status: 200, description: '获取 OAuth2 客户端分页信息成功' })
  getOAuth2ClientPage(@Query() req: OAuth2ClientPageReqDTO) {
    return this.oauth2ClientService.getOAuth2ClientPage(req);
  }
}
