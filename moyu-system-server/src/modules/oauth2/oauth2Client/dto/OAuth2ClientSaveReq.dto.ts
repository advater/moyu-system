import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 客户端创建/修改
 */
export class OAuth2ClientSaveReqDTO {
  @ApiProperty({
    description: '编号',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '客户端编号',
    required: true,
    example: 'moyu',
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: '客户端密钥（创建必填；修改时传空或不传表示不修改）',
    required: false,
    example: 'fan',
  })
  @IsOptional()
  @IsString()
  secret?: string;

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
    example: '我是一个应用',
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
}
