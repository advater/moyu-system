import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 客户端
 */
export class OAuth2ClientResDTO {
  @ApiProperty({
    description: '编号',
    required: true,
    example: 1024,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '客户端编号',
    required: true,
    example: 'moyu',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: '客户端密钥（脱敏，修改时传空表示不改）',
    required: true,
    example: '****',
  })
  @IsString()
  secret: string;

  @ApiProperty({
    description: '应用名',
    required: true,
    example: 'moyu',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '应用图标',
    required: true,
    example: 'https://www.moyu.cn/xx.png',
  })
  @IsString()
  logo: string;

  @ApiProperty({
    description: '应用描述',
    required: false,
    example: '应用123',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: '访问令牌的有效期',
    required: true,
    example: 8640,
  })
  @IsNumber()
  accessTokenValiditySeconds: number;

  @ApiProperty({
    description: '刷新令牌的有效期',
    required: true,
    example: 8640000,
  })
  @IsNumber()
  refreshTokenValiditySeconds: number;

  @ApiProperty({
    description: '可重定向的 URI 地址',
    required: true,
    example: ['https://www.moyu.cn'],
  })
  @IsArray()
  redirectUris: string[];

  @ApiProperty({
    description: '授权类型',
    required: true,
    example: ['password'],
  })
  @IsArray()
  authorizedGrantTypes: string[];

  @ApiProperty({
    description: '授权范围',
    required: false,
    example: ['user_info'],
  })
  @IsOptional()
  @IsArray()
  scopes?: string[];

  @ApiProperty({
    description: '自动通过的授权范围',
    required: false,
    example: ['user_info'],
  })
  @IsOptional()
  @IsArray()
  autoApproveScopes?: string[];

  @ApiProperty({
    description: '权限',
    required: false,
    example: ['system:user:query'],
  })
  @IsOptional()
  @IsArray()
  authorities?: string[];

  @ApiProperty({
    description: '资源',
    required: false,
    example: ['1024'],
  })
  @IsOptional()
  @IsArray()
  resourceIds?: string[];

  @ApiProperty({
    description: '附加信息',
    required: false,
    example: '{yunai: true}',
  })
  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2023-08-01 12:00:00',
  })
  @IsString()
  createTime: string;
}
