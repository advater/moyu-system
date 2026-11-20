import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信渠道分页
 */
export class SmsChannelPageReqDTO extends PageParam {
  @ApiProperty({ description: '任务状态', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '短信签名，模糊匹配', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
