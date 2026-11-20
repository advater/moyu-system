import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信模板分页
 */
export class SmsTemplatePageReqDTO extends PageParam {
  @ApiProperty({ description: '短信签名', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  type?: number;

  @ApiProperty({ description: '开启状态', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '模板编码，模糊匹配', required: false, example: 'test_01' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: '模板内容，模糊匹配', required: false, example: '你好，{name}。你长的太{like}啦！' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '短信 API 的模板编号，模糊匹配', required: false, example: '4383920' })
  @IsOptional()
  @IsString()
  apiTemplateId?: string;

  @ApiProperty({ description: '短信渠道编号', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  channelId?: number;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
