import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { CaptchaVerificationReqDTO } from './CaptchaVerificationReq.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 注册参数
 */
export class AuthRegisterReqDTO extends CaptchaVerificationReqDTO {
  @ApiProperty({
    description: '用户账号',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.USERNAME_REQUIRED })
  @Length(4, 30, { message: ValidationError.USERNAME_LENGTH })
  username: string;

  @ApiProperty({
    description: '用户昵称',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.NICKNAME_REQUIRED })
  @MaxLength(30, { message: ValidationError.NICKNAME_MAX })
  nickname: string;

  @ApiProperty({
    description: '密码',
    required: true,
    example: '123456',
  })
  @IsNotEmpty({ message: ValidationError.PASSWORD_REQUIRED })
  @Length(6, 32, { message: ValidationError.PASSWORD_LENGTH_6_32 })
  password: string;

  @ApiProperty({
    description: '租户编号（也可通过请求头 tenant-id 传递；默认 0）',
    required: false,
    example: '0',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description: '租户名（注册页用，可据此解析 tenantId）',
    required: false,
    example: '默认租户',
  })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  email?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;
}
