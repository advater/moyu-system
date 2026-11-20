import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResDTO {
  @ApiProperty({ description: '文件编号' })
  id: number;

  @ApiProperty({ description: '访问 URL' })
  url: string;

  @ApiProperty({ description: '文件名' })
  name: string;

  @ApiProperty({ description: 'MIME 类型', required: false })
  type?: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;
}
