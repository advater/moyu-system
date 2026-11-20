import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 图形验证码校验参数（登录 / 注册等匿名接口共用）
 */
export class CaptchaVerificationReqDTO {
  @ApiProperty({
    description: '图形验证码 uuid（AUTH_CAPTCHA_ENABLED=true 时必填）',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  captchaUuid?: string;

  @ApiProperty({
    description: '图形验证码内容（AUTH_CAPTCHA_ENABLED=true 时必填）',
    required: false,
    example: 'a1b2',
  })
  @IsOptional()
  @IsString()
  captchaCode?: string;
}
