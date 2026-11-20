import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户套餐创建/修改
 */
export class TenantPackageSaveReqDTO {
  @ApiProperty({ description: '套餐编号', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  id?: number;

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

  @ApiProperty({
    description: '套餐能力位 JSON（如 smsDailyLimit/storageMb）',
    required: false,
    example: { smsDailyLimit: 1000, storageMb: 10240 },
  })
  @IsOptional()
  features?: Record<string, number | string | boolean>;
}
