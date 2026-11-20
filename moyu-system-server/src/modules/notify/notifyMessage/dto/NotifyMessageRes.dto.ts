import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信
 */
export class NotifyMessageResDTO {
  @ApiProperty({ description: 'ID', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户编号', required: true, example: 25025 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '用户类型', required: true, example: 1 })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '模版编号', required: true, example: 13013 })
  @IsNumber()
  templateId: number;

  @ApiProperty({ description: '模板编码', required: true, example: 'test_01' })
  @IsString()
  templateCode: string;

  @ApiProperty({
    description: '模版发送人名称',
    required: true,
    example: 'moyu',
  })
  @IsString()
  templateNickname: string;

  @ApiProperty({ description: '模版内容', required: true, example: '测试内容' })
  @IsString()
  templateContent: string;

  @ApiProperty({ description: '模版类型', required: true, example: 2 })
  @IsNumber()
  templateType: number;

  @ApiProperty({ description: '模版参数', required: true })
  @IsObject()
  templateParams: Record<string, any>;

  @ApiProperty({ description: '是否已读', required: true, example: true })
  @IsBoolean()
  readStatus: boolean;

  @ApiProperty({
    description: '阅读时间',
    required: false,
    example: '2023-08-01 00:00:00',
  })
  @IsOptional()
  @IsString()
  readTime?: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2023-08-01 00:00:00',
  })
  @IsString()
  createTime: string;
}
