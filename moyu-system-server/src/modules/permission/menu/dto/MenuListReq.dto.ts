import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 菜单列表
 */
export class MenuListReqDTO {
  @ApiProperty({
    description: '菜单名称，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '展示状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
