import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 【开放接口】访问令牌
 */
export class OAuth2OpenAccessTokenResDTO {
  @ApiProperty({ description: '访问令牌', required: true, example: 'moyu' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: '刷新令牌', required: true, example: 'nice' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', required: true, example: 'bearer' })
  @IsString()
  tokenType: string;

  @ApiProperty({
    description: '过期时间,单位：秒',
    required: true,
    example: 42430,
  })
  @IsNumber()
  expiresIn: number;

  @ApiProperty({
    description: '授权范围,如果多个授权范围，使用空格分隔',
    required: false,
    example: 'user_info',
  })
  @IsOptional()
  @IsString()
  scope?: string;
}
