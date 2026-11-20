import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * 验证码校验请求
 */
export class CaptchaReqDTO {
  /** 业务场景（预留），如 login / register / sms 等 */
  @ApiPropertyOptional({ description: '业务场景', example: 'login' })
  @IsOptional()
  @IsString()
  scene?: string;

  /** 验证码唯一编号 */
  @ApiPropertyOptional({ description: '验证码唯一编号', example: 'uuid' })
  @IsOptional()
  @IsString()
  uuid?: string;

  /** 用户输入的验证码内容 */
  @ApiPropertyOptional({ description: '验证码内容', example: 'a1b2' })
  @IsOptional()
  @IsString()
  code?: string;
}
