import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 通知公告信息
 */
export class NoticeResDTO {
  @ApiProperty({ description: '通知公告序号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '公告标题', required: true, example: '小博主' })
  @IsString()
  title: string;

  @ApiProperty({ description: '公告类型', required: true, example: '小博主' })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '公告内容', required: true, example: '半生编码' })
  @IsString()
  content: string;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '目标部门编号数组', required: false, type: [Number] })
  targetDeptIds?: number[];

  @ApiProperty({ description: '目标角色编号数组', required: false, type: [Number] })
  targetRoleIds?: number[];

  @ApiProperty({ description: '定时发布时间', required: false })
  publishTime?: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2023-08-01 12:00:00',
  })
  @IsString()
  createTime: string;
}
