import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交客户端创建/修改
 */
export class SocialClientSaveReqDTO {
  @ApiProperty({ description: '编号', required: false, example: 27162 })
  @IsOptional()
  @IsNumber()
  id?: number;

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

  @ApiProperty({
    description: '客户端密钥（创建必填；修改时传空或不传表示不修改）',
    required: false,
    example: 'peter',
  })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiProperty({ description: '授权方的网页应用编号', required: true, example: '2000045' })
  @IsString()
  agentId: string;

  @ApiProperty({ description: 'publicKey 公钥', required: false, example: '2000045' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiProperty({ description: '状态', required: true, example: 1 })
  @IsNumber()
  status: number;

}
