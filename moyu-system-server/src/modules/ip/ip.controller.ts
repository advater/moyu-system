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
import { IpService } from './ip.service';
import { AreaNodeResDTO } from './dto/AreaNodeRes.dto';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

/**
 * IP 区域 Controller
 */
@ApiTags('IP 区域')
@Controller()
export class IpController {
  constructor(private readonly ipService: IpService) {}

  @Get('/tree')
  @ApiOperation({ summary: '获得地区树' })
  @ApiResponse({ status: 200, description: '获取地区树成功' })
  getAreaTree() {
    return this.ipService.getAreaTree();
  }

  @Get('/get-by-ip')
  @ApiOperation({ summary: '获得 IP 对应的地区名' })
  @ApiResponse({ status: 200, description: '获取 IP 对应的地区名成功' })
  getAreaByIp(@Query('ip') ip: string){
    return this.ipService.getAreaByIp(ip);
  }
}
