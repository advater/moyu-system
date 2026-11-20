import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 通知公告创建/修改
 */
export class NoticeSaveReqDTO {
  @ApiProperty({
    description: '公告编号',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '公告标题', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '公告类型', required: true })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '公告内容', required: true })
  @IsString()
  content: string;

  @ApiProperty({ description: '状态', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: '定向部门编号列表（空=全员）',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  targetDeptIds?: number[];

  @ApiProperty({
    description: '定向角色编号列表（与部门取并集；皆空=全员）',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  targetRoleIds?: number[];

  @ApiProperty({
    description: '计划发布时间（ISO 字符串，空=手动推送）',
    required: false,
  })
  @IsOptional()
  @IsString()
  publishTime?: string;
}
