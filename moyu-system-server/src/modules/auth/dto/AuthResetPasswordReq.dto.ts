import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsMobilePhone,
} from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { CaptchaVerificationReqDTO } from './CaptchaVerificationReq.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 重置密码参数
 */
export class AuthResetPasswordReqDTO extends CaptchaVerificationReqDTO {
  @ApiProperty({
    description: '密码',
    required: true,
    example: 'a1b2c3d4',
  })
  @IsNotEmpty({ message: ValidationError.PASSWORD_REQUIRED })
  @Length(6, 32, { message: ValidationError.PASSWORD_LENGTH_6_32 })
  password: string;

  @ApiProperty({
    description: '手机号',
    required: true,
    example: '18055556666',
  })
  @IsNotEmpty({ message: ValidationError.MOBILE_REQUIRED })
  @IsMobilePhone('zh-CN', {})
  mobile: string;

  @ApiProperty({
    description: '手机短信验证码',
    required: true,
    example: '123456',
  })
  @IsNotEmpty({ message: ValidationError.SMS_CODE_REQUIRED })
  @IsString()
  code: string;

  @ApiProperty({
    description: '租户编号（也可通过请求头 tenant-id 传递；默认 0）',
    required: false,
    example: '0',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description: '租户名（登录页找回密码用，可据此解析 tenantId）',
    required: false,
    example: '默认租户',
  })
  @IsOptional()
  @IsString()
  tenantName?: string;
}
