import { ApiProperty } from '@nestjs/swagger';

// 数据字典精简
export class DictDataSimpleResDTO {
  @ApiProperty({ description: '字典类型', required: true, example: 'gender' })
  dictType: string;

  @ApiProperty({ description: '字典键值', required: true, example: '1' })
  value: string;

  @ApiProperty({ description: '字典标签', required: true, example: '男' })
  label: string;

  @ApiProperty({ description: '颜色类型，default、primary、success、info、warning、danger', required: false, example: 'default' })
  colorType: string;

  @ApiProperty({ description: 'css 样式', required: false, example: 'btn-visible' })
  cssClass: string;
}
