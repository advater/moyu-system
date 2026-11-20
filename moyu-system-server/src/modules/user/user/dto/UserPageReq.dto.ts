import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户分页
 */
export class UserPageReqDTO extends PageParam {
  @ApiProperty({ description: '用户账号，模糊匹配', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '手机号码，模糊匹配', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '展示状态类', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '创建时间', required: false, example: '[2022-07-01 00:00:00, 2022-07-01 23:59:59]' })
  @IsOptional()
  @IsArray()
  createTime?: string[];

  @ApiProperty({ description: '部门编号，同时筛选子部门', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ description: '角色编号', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  roleId?: number;

}
