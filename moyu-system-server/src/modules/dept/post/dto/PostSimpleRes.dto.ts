import { ApiProperty } from '@nestjs/swagger';

/**
 * 岗位精简信息响应
 */
export class PostSimpleResDTO {
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
}
