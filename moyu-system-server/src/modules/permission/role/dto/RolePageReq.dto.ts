import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 角色分页
 */
export class RolePageReqDTO extends PageParam {
  @ApiProperty({ description: '角色名称，模糊匹配', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '角色标识，模糊匹配', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: '展示状态', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '创建时间', required: false, example: '[2022-07-01 00:00:00,2022-07-01 23:59:59]' })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
