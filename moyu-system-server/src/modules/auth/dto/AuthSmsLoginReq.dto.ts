import { IsNotEmpty, IsOptional, IsString, IsMobilePhone } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { CaptchaVerificationReqDTO } from './CaptchaVerificationReq.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信验证码登录参数
 */
export class AuthSmsLoginReqDTO extends CaptchaVerificationReqDTO {
  @ApiProperty({
    description: '手机号',
    required: true,
    example: '18055556666',
  })
  @IsNotEmpty({ message: ValidationError.MOBILE_REQUIRED })
  @IsMobilePhone('zh-CN', {})
  mobile: string;

  @ApiProperty({
    description: '短信验证码',
    required: true,
    example: '1024',
  })
  @IsNotEmpty({ message: ValidationError.CAPTCHA_CODE_REQUIRED })
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
}
