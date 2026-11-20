import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信渠道创建/修改
 */
export class SmsChannelSaveReqDTO {
  @ApiProperty({ description: '编号', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '短信签名', required: true, example: 'moyu' })
  @IsString()
  signature: string;

  @ApiProperty({ description: '渠道编码', required: true, example: 'YUN_PIAN' })
  @IsString()
  code: string;

  @ApiProperty({ description: '启用状态类', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '备注', required: false, example: '好吃！' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '短信 API 的账号', required: true, example: 'moyu' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: '短信 API 的密钥', required: false, example: 'yuanma' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiProperty({ description: '短信发送回调 URL', required: false, example: 'http://www.moyu.cn' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

}
