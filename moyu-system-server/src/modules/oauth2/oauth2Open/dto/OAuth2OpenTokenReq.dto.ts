import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 获取访问令牌请求体
 *
 * 敏感字段（如 refresh_token）禁止走 Query，避免进入访问日志 / 代理缓存。
 * 当前仅支持 authorization_code / refresh_token；password 模式由 /admin/auth/login 承担。
 */
export class OAuth2OpenTokenReqDTO {
  @ApiProperty({
    description: '授权类型：authorization_code | refresh_token',
    example: 'authorization_code',
  })
  @IsString()
  grant_type: string;

  @ApiProperty({ description: '授权码（authorization_code 模式）', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: '重定向 URI', required: false })
  @IsOptional()
  @IsString()
  redirect_uri?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: '授权范围', required: false })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ description: '刷新令牌（refresh_token 模式）', required: false })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
