import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

// 字典类型分页列表
export class DictDataPageReqDTO extends PageParam {
  @ApiProperty({
    description: '字典标签',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: ValidationError.DICT_LABEL_MAX })
  label?: string;

  @ApiProperty({
    description: '字典类型，模糊匹配',
    required: false,
    example: 'sys_common_sex',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: ValidationError.DICT_TYPE_MAX })
  dictType?: string;

  @ApiProperty({
    description: '展示状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
