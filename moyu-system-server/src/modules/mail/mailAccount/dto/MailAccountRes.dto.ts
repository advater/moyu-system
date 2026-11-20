import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮箱账号
 */
export class MailAccountResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '邮箱', required: true, example: 'moyuma@123.com' })
  @IsString()
  mail: string;

  @ApiProperty({ description: '用户名', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码（脱敏，修改时传空表示不改）', required: true, example: '****3456' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'SMTP 服务器域名', required: true, example: 'www.moyu.cn' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'SMTP 服务器端口', required: true, example: 80 })
  @IsNumber()
  port: number;

  @ApiProperty({ description: '是否开启 ssl', required: true, example: true })
  @IsBoolean()
  sslEnable: boolean;

  @ApiProperty({ description: '是否开启 starttls', required: true, example: true })
  @IsBoolean()
  starttlsEnable: boolean;

  @ApiProperty({ description: '创建时间', required: true, example: '2023-08-01 00:00:00' })
  @IsString()
  createTime: string;

}
