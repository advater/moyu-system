import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信日志分页
 */
export class SmsLogPageReqDTO extends PageParam {
  @ApiProperty({ description: '短信渠道编号', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  channelId?: number;

  @ApiProperty({ description: '模板编号', required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiProperty({ description: '手机号', required: false, example: '15601691300' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '发送状态类', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  sendStatus?: number;

  @ApiProperty({ description: '发送时间', required: false })
  @IsOptional()
  @IsArray()
  sendTime?: string[];

  @ApiProperty({ description: '接收状态类', required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  receiveStatus?: number;

  @ApiProperty({ description: '接收时间', required: false })
  @IsOptional()
  @IsArray()
  receiveTime?: string[];

}
