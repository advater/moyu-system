import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户套餐
 */
export class TenantPackageResDTO {
  @ApiProperty({ description: '套餐编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '套餐名', required: true, example: 'VIP' })
  @IsString()
  name: string;

  @ApiProperty({ description: '状态', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '备注', required: false, example: '好' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '关联的菜单编号', required: true })
  @IsArray()
  menuIds: number[];

  @ApiProperty({ description: '套餐能力位', required: false })
  @IsOptional()
  features?: Record<string, number | string | boolean>;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
