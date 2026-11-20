import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮件模版的精简
 */
export class MailTemplateSimpleResDTO {
  @ApiProperty({ description: '模版编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '模版名字', required: true, example: '哒哒哒' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模版编码', required: true, example: 'mail_001' })
  @IsString()
  code: string;
}
