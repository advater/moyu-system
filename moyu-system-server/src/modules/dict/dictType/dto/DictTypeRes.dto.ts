import { ApiProperty } from '@nestjs/swagger';

// 字典类型信息
export class DictTypeResDTO {
  @ApiProperty({ description: '字典类型编号', required: true, example: 1024 })
  id: number;

  @ApiProperty({ description: '字典名称', required: true, example: '性别' })
  name: string;

  @ApiProperty({ description: '字典类型', required: true, example: 'sys_common_sex' })
  type: string;

  @ApiProperty({ description: '状态', required: true, example: 1 })
  status: number;

  @ApiProperty({ description: '备注', required: false, example: '备注123' })
  remark: string;

  @ApiProperty({ description: '创建时间', required: true, example: '2022-07-01 00:00:00' })
  createTime: string;
}
