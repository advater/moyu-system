import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮件末班
 */
export class MailTemplateResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '模版名称', required: true, example: '测试名字' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模版编号', required: true, example: 'test' })
  @IsString()
  code: string;

  @ApiProperty({
    description: '发送的邮箱账号编号',
    required: true,
    example: 1,
  })
  @IsNumber()
  accountId: number;

  @ApiProperty({ description: '发送人名称', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '标题', required: true, example: '注册成功' })
  @IsString()
  title: string;

  @ApiProperty({
    description: '内容',
    required: true,
    example: '你好，注册成功啦',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '参数数组',
    required: false,
    example: ['name,code'],
  })
  @IsOptional()
  @IsArray()
  params?: string[];

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '备注', required: false, example: '备注123' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;
}
