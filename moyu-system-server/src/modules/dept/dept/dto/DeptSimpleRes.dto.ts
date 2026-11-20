import { ApiProperty } from '@nestjs/swagger';
/**
 * 部门精简信息响应
 */
export class DeptSimpleResDTO {
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
    required: true,
    example: 1024,
  })
  parentId: number;
}
