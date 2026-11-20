import { ApiProperty } from '@nestjs/swagger';

export class DictDataResDTO {
  @ApiProperty({ description: '字典编码', required: true, example: '1024' })
  id: number;

  @ApiProperty({ description: '字典排序', required: true, example: '1' })
  sort: number;

  @ApiProperty({ description: '字典标签', required: true, example: '男' })
  label: string;

  @ApiProperty({ description: '字典值', required: true, example: '1' })
  value: string;

  @ApiProperty({
    description: '字典类型',
    required: true,
    example: 'sys_common_sex',
  })
  dictType: string;

  @ApiProperty({ description: '状态', default: 1, example: '1' })
  status: number;

  @ApiProperty({
    description: '颜色类型,default、primary、success、info、warning、danger',
    example: 'default',
  })
  colorType: string;

  @ApiProperty({ description: 'css 样式', example: 'btn-visible' })
  cssClass: string;

  @ApiProperty({ description: '备注', example: '' })
  remark: string;

  @ApiProperty({
    description: '创建时间',
    required: true,
    example: '2026-01-01 00:00:00',
  })
  createTime: string;
}
