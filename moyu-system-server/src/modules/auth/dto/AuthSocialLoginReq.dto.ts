import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交快捷登录参数
 */
export class AuthSocialLoginReqDTO {
  @ApiProperty({
    description: '社交平台的类型',
    required: true,
    example: 30,
  })
  @IsNotEmpty({ message: ValidationError.SOCIAL_TYPE_REQUIRED })
  @IsNumber()
  type: number;

  @ApiProperty({
    description: '授权码',
    required: true,
    example: '1024',
  })
  @IsNotEmpty({ message: ValidationError.AUTH_CODE_REQUIRED })
  @IsString()
  code: string;

  @ApiProperty({
    description: '授权 state',
    required: true,
    example: '9b2ffbc1-7425-4155-9894-9d5c08541d62',
  })
  @IsNotEmpty({ message: ValidationError.SOCIAL_STATE_REQUIRED })
  @IsString()
  state: string;
}
