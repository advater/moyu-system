import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 登录日志信息响应
 */
export class LoginLogResDTO {
  @ApiProperty({ description: '日志编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '日志类型', required: true, example: 1 })
  @IsNumber()
  logType: number;

  @ApiProperty({ description: '用户编号', required: false, example: 666 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '用户类型', required: true, example: 2 })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '链路追踪编号', required: false, example: '89aca178-a370-411c-ae02-3f0d672be4ab' })
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiProperty({ description: '用户账号', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '登录结果', required: true, example: 1 })
  @IsNumber()
  result: number;

  @ApiProperty({ description: '用户 IP', required: true, example: '127.0.0.1' })
  @IsString()
  userIp: string;

  @ApiProperty({
    description: 'IP 归属地',
    required: false,
    example: '中国 广东省 深圳市',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: '浏览器 UserAgent', required: false, example: 'Mozilla/5.0' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: '失败原因（业务错误码，成功时为空）',
    required: false,
    example: 'AUTH.PASSWORD_MISMATCH',
  })
  @IsOptional()
  @IsString()
  failReason?: string;

  @ApiProperty({ description: '登录时间', required: true, example: '2022-07-01 00:00:00' })
  @IsString()
  createTime: string;
}
