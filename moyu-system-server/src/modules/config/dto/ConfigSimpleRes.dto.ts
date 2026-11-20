import { ApiProperty } from '@nestjs/swagger';

export class ConfigSimpleResDTO {
  @ApiProperty({ description: '参数编号' })
  id: number;

  @ApiProperty({ description: '参数名称' })
  name: string;

  @ApiProperty({ description: '参数键名' })
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  value: string;
}
