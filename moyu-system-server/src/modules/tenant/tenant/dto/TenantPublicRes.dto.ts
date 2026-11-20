import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 公开场景租户精简信息（登录选租户 / 域名解析，不含联系方式与套餐等敏感字段）
 */
export class TenantPublicResDTO {
  @ApiProperty({ description: '租户编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '租户名', required: true, example: 'moyu' })
  @IsString()
  name: string;
}
