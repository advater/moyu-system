import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户套餐分页
 */
export class TenantPackagePageReqDTO extends PageParam {
  @ApiProperty({ description: '套餐名', required: false, example: 'VIP' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '状态', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '备注', required: false, example: '好' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
