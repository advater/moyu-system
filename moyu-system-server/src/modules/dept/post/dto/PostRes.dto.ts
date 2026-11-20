import { ApiProperty } from '@nestjs/swagger';

/**
 * 岗位信息响应
 */
export class PostResDTO {
  @ApiProperty({
    description: '岗位序号',
    required: true,
    example: 1024,
  })
  id: number;

  @ApiProperty({
    description: '岗位名称',
    required: true,
    example: 'moyu',
  })
  name: string;

  @ApiProperty({
    description: '岗位编码',
    required: true,
    example: '1234',
  })
  code: string;

  @ApiProperty({
    description: '显示顺序',
    required: true,
    example: 1024,
  })
  sort: number;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  status: number;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '备注123',
  })
  remark?: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2022-07-01 00:00:00',
  })
  createTime: string;
}
