import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交用户
 */
export class SocialUserResDTO {
  @ApiProperty({ description: '主键(自增策略)', required: true, example: 14569 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '社交平台的类型', required: true, example: 30 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '社交 openid', required: true, example: '666' })
  @IsString()
  openid: string;

  @ApiProperty({ description: '社交 token', required: true, example: '666' })
  @IsString()
  token: string;

  @ApiProperty({ description: '原始 Token 数据，一般是 JSON 格式', required: true, example: '{}' })
  @IsString()
  rawTokenInfo: string;

  @ApiProperty({ description: '用户昵称', required: true, example: 'moyu' })
  @IsString()
  nickname: string;

  @ApiProperty({ description: '用户头像', required: false, example: 'https://www.moyu.cn/xxx.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '原始用户数据，一般是 JSON 格式', required: true, example: '{}' })
  @IsString()
  rawUserInfo: string;

  @ApiProperty({ description: '最后一次的认证 code', required: true, example: '666666' })
  @IsString()
  code: string;

  @ApiProperty({ description: '最后一次的认证 state', required: true, example: '123456' })
  @IsString()
  state: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

  @ApiProperty({ description: '更新时间', required: true })
  @IsString()
  updateTime: string;

}
