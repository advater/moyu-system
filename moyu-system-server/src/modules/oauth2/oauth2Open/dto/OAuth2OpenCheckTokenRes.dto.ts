import { IsArray, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 【开放接口】校验令牌
 */
export class OAuth2OpenCheckTokenResDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 666 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '用户类型', required: true, example: 2 })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '租户编号', required: true, example: 1024 })
  @IsNumber()
  tenantId: number;

  @ApiProperty({ description: '客户端编号', required: true, example: 'car' })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: '授权范围',
    required: true,
    example: ['user_info'],
  })
  @IsArray()
  scopes: string[];

  @ApiProperty({ description: '访问令牌', required: true, example: 'moyu' })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: '过期时间，时间戳 / 1000，即单位：秒',
    required: true,
    example: 1593092157,
  })
  @IsNumber()
  exp: number;
}
