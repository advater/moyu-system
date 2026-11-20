import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录日志分页列表请求
 */
export class LoginLogPageReqDTO extends PageParam {
  @ApiProperty({
    description: '用户 IP，模糊匹配',
    required: false,
    example: '127.0.0.1',
  })
  @IsOptional()
  @IsString()
  userIp?: string;

  @ApiProperty({
    description: '用户账号，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '操作状态',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({
    description: '登录时间范围，格式 [开始时间, 结束时间]',
    required: false,
    example: ['2022-07-01 00:00:00', '2022-07-01 23:59:59'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
