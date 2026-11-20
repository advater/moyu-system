import { ApiProperty } from '@nestjs/swagger';

// 字典类型精简信息
export class DictTypeSimpleResDTO {
  @ApiProperty({ description: '字典类型编号', required: true, example: 1024 })
  id: number;

  @ApiProperty({ description: '字典类型名称', required: true, example: 'moyu' })
  name: string;

  @ApiProperty({ description: '字典类型', required: true, example: 'sys_common_sex' })
  type: string;
}
