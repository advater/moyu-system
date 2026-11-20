import { ApiProperty } from '@nestjs/swagger';

/**
 * 部门信息响应
 */
export class DeptResDTO {
  @ApiProperty({
    description: '部门编号',
    required: true,
    example: 1024,
  })
  id: number;

  @ApiProperty({
    description: '部门名称',
    required: true,
    example: 'moyu',
  })
  name: string;

  @ApiProperty({
    description: '父部门 ID',
    required: false,
    example: 1024,
  })
  parentId?: number;

  @ApiProperty({
    description: '显示顺序',
    required: true,
    example: 1024,
  })
  sort: number;

  @ApiProperty({
    description: '负责人的用户编号',
    required: false,
    example: 2048,
  })
  leaderUserId?: number;

  @ApiProperty({
    description: '联系电话',
    required: false,
    example: '18055556666',
  })
  phone?: string;

  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'moyu@qq.com',
  })
  email?: string;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  status: number;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2022-07-01 00:00:00',
  })
  createTime: string;
}
