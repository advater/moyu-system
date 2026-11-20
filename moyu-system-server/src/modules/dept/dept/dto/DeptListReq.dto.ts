import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 部门列表查询参数（树形全量列表，不分页）
 */
export class DeptListReqDTO {
  @ApiProperty({
    description: '部门名称，模糊匹配',
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
