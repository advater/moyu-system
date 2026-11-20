import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

// 字典数据创建/修改
export class DictDataSaveReqDTO {
  @ApiProperty({
    description: '字典数据编号',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '显示顺序',
    required: true,
    example: 1024,
  })
  @IsNumber({}, { message: ValidationError.SORT_REQUIRED })
  sort: number;

  @ApiProperty({
    description: '字典标签',
    required: true,
    example: 'moyu',
  })
  @IsString()
  @IsNotEmpty({ message: ValidationError.DICT_LABEL_REQUIRED })
  @MaxLength(100, { message: ValidationError.DICT_LABEL_MAX })
  label: string;

  @ApiProperty({
    description: '字典值',
    required: true,
    example: 'iocoder',
  })
  @IsString()
  @IsNotEmpty({ message: ValidationError.DICT_VALUE_REQUIRED })
  @MaxLength(100, { message: ValidationError.DICT_VALUE_MAX })
  value: string;

  @ApiProperty({
    description: '字典类型',
    required: true,
    example: 'sys_common_sex',
  })
  @IsString()
  @IsNotEmpty({ message: ValidationError.DICT_TYPE_REQUIRED })
  @MaxLength(100, { message: ValidationError.DICT_TYPE_LEN_MAX })
  dictType: string;

  @ApiProperty({
    description: '状态,见 CommonStatusEnum 枚举',
    required: true,
    example: 1,
  })
  @IsNumber({}, { message: ValidationError.STATUS_REQUIRED })
  status: number;

  @ApiProperty({
    description: '颜色类型,default、primary、success、info、warning、danger',
    required: false,
    example: 'default',
  })
  @IsOptional()
  @IsString()
  colorType?: string;

  @ApiProperty({
    description: 'css 样式',
    required: false,
    example: 'btn-visible',
  })
  @IsOptional()
  @IsString()
  cssClass?: string;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '我是一个角色',
  })
  @IsOptional()
  @IsString()
  remark?: string;
}
