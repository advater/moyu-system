import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 访问令牌
 */
export class OAuth2TokenResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '访问令牌', required: true, example: 'moyu' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: '刷新令牌', required: true, example: 'nice' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: '用户编号', required: true, example: 666 })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '用户类型',
    required: true,
    example: 2,
  })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '客户端编号', required: true, example: '2' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

  @ApiProperty({ description: '过期时间', required: true })
  @IsString()
  expiresTime: string;
}
