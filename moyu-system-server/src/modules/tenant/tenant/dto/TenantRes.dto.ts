import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 租户
 */
export class TenantResDTO {
  @ApiProperty({ description: '租户编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '租户名', required: true, example: 'moyu' })
  @IsString()
  name: string;

  @ApiProperty({ description: '联系人', required: true, example: 'moyu' })
  @IsString()
  contactName: string;

  @ApiProperty({ description: '联系手机', required: false, example: '15601691300' })
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiProperty({ description: '租户状态', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '绑定域名数组', required: false, example: ["https://www.moyu.cn"] })
  @IsOptional()
  @IsArray()
  websites?: string[];

  @ApiProperty({ description: '租户套餐编号', required: true, example: 1024 })
  @IsNumber()
  packageId: number;

  @ApiProperty({ description: '过期时间', required: true })
  @IsString()
  expireTime: string;

  @ApiProperty({ description: '账号数量', required: true, example: 1024 })
  @IsNumber()
  accountCount: number;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
