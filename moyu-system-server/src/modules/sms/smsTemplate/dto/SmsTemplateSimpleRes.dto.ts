import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信模板的精简
 */
export class SmsTemplateSimpleResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '模板名称', required: true, example: '验证码' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模板编码', required: true, example: 'sms_001' })
  @IsString()
  code: string;

}
