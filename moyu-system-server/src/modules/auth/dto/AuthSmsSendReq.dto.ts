import {
  IsNotEmpty,
  IsNumber,
  IsMobilePhone,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { CaptchaVerificationReqDTO } from './CaptchaVerificationReq.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 发送短信验证码参数
 */
export class AuthSmsSendReqDTO extends CaptchaVerificationReqDTO {
  @ApiProperty({
    description: '手机号',
    required: true,
    example: '18055556666',
  })
  @IsNotEmpty({ message: ValidationError.MOBILE_REQUIRED })
  @IsMobilePhone('zh-CN', {})
  mobile: string;

  @ApiProperty({
    description: '短信场景',
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: ValidationError.SMS_SCENE_REQUIRED })
  @IsNumber()
  scene: number;

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
