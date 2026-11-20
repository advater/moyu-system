import {
  IsEmail,
  IsIn,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CommonError, ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户个人信息更新（全部可选；未传不改，空串/null 清空）
 */
export class UserProfileUpdateReqDTO {
  @ApiProperty({
    description: '用户昵称（传空串或 null 清空）',
    required: false,
    nullable: true,
    example: 'moyu',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  @MaxLength(30)
  nickname?: string | null;

  @ApiProperty({
    description: '用户邮箱（传空串或 null 清空）',
    required: false,
    nullable: true,
    example: 'moyu@qq.com',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsEmail({}, { message: CommonError.EMAIL_INVALID })
  @MaxLength(50)
  email?: string | null;

  @ApiProperty({
    description: '手机号码（传空串或 null 清空）',
    required: false,
    nullable: true,
    example: '15601691300',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsMobilePhone('zh-CN', {}, { message: CommonError.MOBILE_INVALID })
  mobile?: string | null;

  @ApiProperty({
    description: '用户性别：0未知 1男 2女（传 null 清空）',
    required: false,
    nullable: true,
    example: 1,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @IsIn([0, 1, 2], { message: ValidationError.SEX_RANGE })
  sex?: number | null;

  @ApiProperty({
    description: '用户头像 URL（传空串或 null 清空）',
    required: false,
    nullable: true,
    example: 'https://www.moyu.cn/1.png',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  @MaxLength(255)
  avatar?: string | null;
}
