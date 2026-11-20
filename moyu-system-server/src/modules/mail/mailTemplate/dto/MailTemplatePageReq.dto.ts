import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮件模版分页
 */
export class MailTemplatePageReqDTO extends PageParam {
  @ApiProperty({
    description: '状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({
    description: '标识，模糊匹配',
    required: false,
    example: 'code_1024',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: '名称，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '账号编号',
    required: false,
    example: 2048,
  })
  @IsOptional()
  @IsNumber()
  accountId?: number;

  @ApiProperty({
    description: '创建时间',
    required: false,
    example: ['2023-08-01 00:00:00', '2023-08-02 23:59:59'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
