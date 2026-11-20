import { ValidationError } from '@/config/error-messages';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigSaveReqDTO {
  @ApiProperty({ description: '编号', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '分组', required: false, example: 'sms' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ description: '参数名称', example: '短信日发送上限' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.CONFIG_NAME_REQUIRED })
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '参数键名', example: 'sms.daily.limit' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.CONFIG_KEY_REQUIRED })
  @MaxLength(100)
  configKey: string;

  @ApiProperty({ description: '参数键值', example: '100' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.CONFIG_VALUE_REQUIRED })
  @MaxLength(2000)
  value: string;

  @ApiProperty({ description: '是否前端可见', example: true })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
