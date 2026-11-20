import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信模版的精简
 */
export class NotifyTemplateSimpleResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '模版名称', required: true, example: '系统通知' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模版编码', required: true, example: 'notify_001' })
  @IsString()
  code: string;

}
