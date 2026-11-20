import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 操作日志信息响应
 */
export class OperateLogResDTO {
  @ApiProperty({ description: '日志编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '链路追踪编号',
    required: true,
    example: '89aca178-a370-411c-ae02-3f0d672be4ab',
  })
  @IsString()
  traceId: string;

  @ApiProperty({ description: '用户编号', required: true, example: 1024 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '用户昵称', required: true, example: 'moyu' })
  @IsString()
  userName: string;

  @ApiProperty({ description: '用户类型', required: true, example: 1 })
  @IsNumber()
  userType: number;

  @ApiProperty({ description: '操作模块类型', required: true, example: '订单' })
  @IsString()
  type: string;

  @ApiProperty({ description: '操作名', required: true, example: '创建订单' })
  @IsString()
  subType: string;

  @ApiProperty({ description: '操作模块业务编号', required: true, example: 1 })
  @IsNumber()
  bizId: number;

  @ApiProperty({
    description: '操作明细',
    required: false,
    example:
      '修改编号为 1 的用户信息，将性别从男改成女，将姓名从moyu改成avatar。',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: '拓展字段',
    required: false,
    example: "{'orderId': 1}",
  })
  @IsOptional()
  @IsString()
  extra?: string;

  @ApiProperty({ description: '请求方法名', required: true, example: 'GET' })
  @IsString()
  requestMethod: string;

  @ApiProperty({ description: '请求地址', required: true, example: '/xxx/yyy' })
  @IsString()
  requestUrl: string;

  @ApiProperty({ description: '用户 IP', required: true, example: '127.0.0.1' })
  @IsString()
  userIp: string;

  @ApiProperty({
    description: '浏览器 UserAgent',
    required: true,
    example: 'Mozilla/5.0',
  })
  @IsString()
  userAgent: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2022-07-01 00:00:00',
  })
  @IsString()
  createTime: string;
}
