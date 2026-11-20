import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮箱账号的精简响应
 */
export class MailAccountSimpleResDTO {
  @ApiProperty({ description: '邮箱编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '邮箱',
    required: true,
    example: '768541388@qq.com',
  })
  @IsString()
  mail: string;
}
