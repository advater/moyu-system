import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交客户端
 */
export class SocialClientResDTO {
  @ApiProperty({ description: '编号', required: true, example: 27162 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '应用名', required: true, example: 'moyu商城' })
  @IsString()
  name: string;

  @ApiProperty({ description: '社交平台的类型', required: true, example: 31 })
  @IsNumber()
  socialType: number;

  @ApiProperty({ description: '用户类型', required: true, example: 2 })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '客户端编号', required: true, example: 'wwd411c69a39ad2e54' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: '客户端密钥（脱敏，修改时传空表示不改）', required: true, example: '****eter' })
  @IsString()
  clientSecret: string;

  @ApiProperty({ description: '授权方的网页应用编号', required: false, example: '2000045' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ description: 'publicKey 公钥', required: false, example: '2000045' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiProperty({ description: '状态', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
