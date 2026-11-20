import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ErrorCodeSaveReqDTO {
  @ApiProperty({ description: '错误码编号', required: false })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ example: 2, description: '类型：1 自动 / 2 手动' })
  @Type(() => Number)
  @IsInt()
  type: number;

  @ApiProperty({ description: '应用名', example: 'moyu-system-server' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  applicationName: string;

  @ApiProperty({ description: '错误码', example: 1001001000 })
  @Type(() => Number)
  @IsInt()
  code: number;

  @ApiProperty({
    example: '{"zh-CN":"用户不存在","en-US":"User not found"}',
    description:
      '运营文案：i18n key（如 USER.NOT_FOUND）、双语 JSON，或历史自由文本',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  message: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  memo?: string;
}
