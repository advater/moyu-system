import { ApiProperty } from '@nestjs/swagger';

export class ConfigResDTO {
  @ApiProperty({ description: '参数编号' })
  id: number;

  @ApiProperty({ description: '分组', required: false })
  category?: string;

  @ApiProperty({ description: '参数名称' })
  name: string;

  @ApiProperty({ description: '参数键名' })
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  value: string;

  @ApiProperty({ description: '是否前端可见' })
  visible: boolean;

  @ApiProperty({ description: '备注', required: false })
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
