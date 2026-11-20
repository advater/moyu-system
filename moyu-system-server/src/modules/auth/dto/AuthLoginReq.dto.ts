import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 账号密码登录
 * 兼容 yudao-ui：可附带 tenantName / rememberMe（仅前端用，服务端可选解析）
 */
export class AuthLoginReqDTO {
  @ApiProperty({
    description: '账号',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.LOGIN_USERNAME_REQUIRED })
  @IsString()
  @Length(4, 30, { message: ValidationError.LOGIN_USERNAME_LENGTH })
  username: string;

  @ApiProperty({
    description: '密码',
    required: true,
    example: 'a1b2c3',
  })
  @IsNotEmpty({ message: ValidationError.PASSWORD_REQUIRED })
  @IsString()
  @Length(4, 16, { message: ValidationError.PASSWORD_LENGTH_4_16 })
  password: string;

  // ========== 绑定社交登录时，需要传递如下参数 ==========
  @ApiProperty({
    description: '社交平台的类型',
    required: false,
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  socialType?: number;

  @ApiProperty({
    description: '授权码',
    required: false,
    example: '1024',
  })
  @IsOptional()
  @IsString()
  socialCode?: string;

  @ApiProperty({
    description: '授权 state',
    required: false,
    example: '7425-4155-9894-9d5c08541d62',
  })
  @IsOptional()
  @IsString()
  socialState?: string;

  @ApiProperty({
    description: '租户编号（也可通过请求头 tenant-id 传递；默认 0）',
    required: false,
    example: '0',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description: '租户名（yudao-ui 登录表单字段；可据此解析 tenantId）',
    required: false,
    example: '默认租户',
  })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiProperty({
    description: '记住我（前端本地缓存用，后端忽略）',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

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

  @ApiProperty({
    description: '行为验证码串（yudao-ui captchaVerification，可选透传）',
    required: false,
  })
  @IsOptional()
  @IsString()
  captchaVerification?: string;
}
