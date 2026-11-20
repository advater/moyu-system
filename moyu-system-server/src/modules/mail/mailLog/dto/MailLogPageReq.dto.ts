import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮箱日志分页
 */
export class MailLogPageReqDTO extends PageParam {
  @ApiProperty({
    description: '用户编号',
    required: false,
    example: 30883,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: '用户类型',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  userType?: number;

  @ApiProperty({
    description: '接收邮箱地址，模糊匹配',
    required: false,
    example: '76854@qq.com',
  })
  @IsOptional()
  @IsString()
  toMail?: string;

  @ApiProperty({
    description: '邮箱账号编号',
    required: false,
    example: 18107,
  })
  @IsOptional()
  @IsNumber()
  accountId?: number;

  @ApiProperty({
    description: '模板编号',
    required: false,
    example: 5678,
  })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiProperty({
    description: '发送状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  sendStatus?: number;

  @ApiProperty({
    description: '发送时间',
    required: false,
    example: ['2023-08-01 00:00:00', '2023-08-02 23:59:59'],
  })
  @IsOptional()
  @IsArray()
  sendTime?: string[];
}
