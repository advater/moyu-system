import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信模板
 */
export class SmsTemplateResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '短信类型', required: true, example: 1 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '开启状态类', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '模板编码', required: true, example: 'test_01' })
  @IsString()
  code: string;

  @ApiProperty({ description: '模板名称', required: true, example: 'moyu' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模板内容', required: true, example: '你好，{name}。你长的太{like}啦！' })
  @IsString()
  content: string;

  @ApiProperty({ description: '参数数组', required: false, example: ["name,code"] })
  @IsOptional()
  @IsArray()
  params?: string[];

  @ApiProperty({ description: '备注', required: false, example: '哈哈哈' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '短信 API 的模板编号', required: true, example: '4383920' })
  @IsString()
  apiTemplateId: string;

  @ApiProperty({ description: '短信渠道编号', required: true, example: 10 })
  @IsNumber()
  channelId: number;

  @ApiProperty({ description: '短信渠道编码', required: true, example: 'ALIYUN' })
  @IsString()
  channelCode: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
