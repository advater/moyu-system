import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';

/**
 * 操作日志分页列表请求
 */
export class OperateLogPageReqDTO extends PageParam {
  @ApiProperty({
    description: '用户编号',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: '操作模块业务编号',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  bizId?: number;

  @ApiProperty({
    description: '操作模块，模糊匹配',
    required: false,
    example: '订单',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: '操作名，模糊匹配',
    required: false,
    example: '创建订单',
  })
  @IsOptional()
  @IsString()
  subType?: string;

  @ApiProperty({
    description: '操作明细，模糊匹配',
    required: false,
    example: '修改编号为 1 的用户信息',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: '创建时间范围，格式 [开始时间, 结束时间]',
    required: false,
    example: ['2022-07-01 00:00:00', '2022-07-01 23:59:59'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
