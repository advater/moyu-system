import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信渠道精简
 */
export class SmsChannelSimpleResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '短信签名', required: true, example: 'moyu' })
  @IsString()
  signature: string;

  @ApiProperty({ description: '渠道编码', required: true, example: 'YUN_PIAN' })
  @IsString()
  code: string;

}
