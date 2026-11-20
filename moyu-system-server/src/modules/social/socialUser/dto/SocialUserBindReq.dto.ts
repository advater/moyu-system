import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交绑定，使用 code 授权码
 */
export class SocialUserBindReqDTO {
  @ApiProperty({ description: '社交平台的类型', required: true, example: 10 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '授权码', required: true, example: '1024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'state', required: true, example: '9b2ffbc1-7425-4155-9894-9d5c08541d62' })
  @IsString()
  state: string;

}
