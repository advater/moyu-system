import { IsOptional, IsString, IsNumber, IsArray, MaxLength } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

// 字典类型分页列表
export class DictTypePageReqDTO extends PageParam {
  @ApiProperty({
    description: '字典类型名称，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '字典类型，模糊匹配',
    required: false,
    example: 'sys_common_sex',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: ValidationError.DICT_TYPE_MAX })
  type?: string;

  @ApiProperty({
    description: '展示状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({
    description: '创建时间',
    required: false,
    example: ['2026-01-01 00:00:00', '2026-12-31 23:59:59'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
