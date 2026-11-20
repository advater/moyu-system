import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 取消社交绑定
 */
export class SocialUserUnbindReqDTO {
  @ApiProperty({ description: '社交平台的类型', required: true, example: 10 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '社交用户的 openid', required: true, example: 'IPRmJ0wvBptiPIlGEZiPewGwiEiE' })
  @IsString()
  openid: string;

}
