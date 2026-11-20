import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 验证码响应
 */
export class CaptchaResDTO {
  @ApiProperty({ description: '验证码唯一编号', example: 'uuid' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: '验证码图片（base64 的 SVG 图）', example: 'data:image/svg+xml;base64,...' })
  @IsString()
  image: string;
}
