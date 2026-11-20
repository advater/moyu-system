import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户套餐精简
 */
export class TenantPackageSimpleResDTO {
  @ApiProperty({ description: '套餐编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '套餐名', required: true, example: 'VIP' })
  @IsString()
  name: string;

}
