import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

// 字典类型创建/修改
export class DictTypeSaveReqDTO {
  @ApiProperty({
    description: '字典类型编号',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '字典名称',
    required: true,
    example: '性别',
  })
  @IsString()
  @IsNotEmpty({ message: ValidationError.DICT_NAME_REQUIRED })
  @MaxLength(100, { message: ValidationError.DICT_NAME_MAX })
  name: string;

  @ApiProperty({
    description: '字典类型',
    required: true,
    example: 'sys_common_sex',
  })
  @IsString()
  @IsNotEmpty({ message: ValidationError.DICT_TYPE_REQUIRED })
  @MaxLength(100, { message: ValidationError.DICT_TYPE_MAX_SPACED })
  type: string;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  @IsNumber({}, { message: ValidationError.STATUS_REQUIRED })
  status: number;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '备注123',
  })
  @IsOptional()
  @IsString()
  remark?: string;
}
