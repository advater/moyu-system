import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户分页
 */
export class TenantPageReqDTO extends PageParam {
  @ApiProperty({ description: '租户名', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '联系人', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiProperty({ description: '联系手机', required: false, example: '15601691300' })
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiProperty({ description: '租户状态（0正常 1停用）', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
