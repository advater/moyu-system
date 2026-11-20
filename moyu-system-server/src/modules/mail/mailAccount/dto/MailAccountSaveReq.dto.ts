import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮箱账号创建/修改
 */
export class MailAccountSaveReqDTO {
  @ApiProperty({
    description: '编号',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '邮箱',
    required: true,
    example: 'moyuma@123.com',
  })
  @IsString()
  mail: string;

  @ApiProperty({
    description: '用户名',
    required: true,
    example: 'moyu',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '密码（创建必填；修改时传空或不传表示不修改）',
    required: false,
    example: '123456',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'SMTP 服务器域名',
    required: true,
    example: 'www.moyu.cn',
  })
  @IsString()
  host: string;

  @ApiProperty({
    description: 'SMTP 服务器端口',
    required: true,
    example: 80,
  })
  @IsNumber()
  port: number;

  @ApiProperty({
    description: '是否开启 ssl',
    required: true,
    example: true,
  })
  @IsBoolean()
  sslEnable: boolean;

  @ApiProperty({
    description: '是否开启 starttls',
    required: true,
    example: true,
  })
  @IsBoolean()
  starttlsEnable: boolean;
}
