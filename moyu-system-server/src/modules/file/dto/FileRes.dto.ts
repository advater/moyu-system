import { ApiProperty } from '@nestjs/swagger';

export class FileResDTO {
  @ApiProperty({ description: '文件编号' })
  id: number;

  @ApiProperty({ description: '文件名' })
  name: string;

  @ApiProperty({ description: '文件路径' })
  path: string;

  @ApiProperty({ description: '访问 URL' })
  url: string;

  @ApiProperty({ description: 'MIME 类型', required: false })
  type?: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
