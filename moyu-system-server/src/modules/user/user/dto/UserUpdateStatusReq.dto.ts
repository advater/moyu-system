import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户更新状态
 */
export class UserUpdateStatusReqDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '状态，见 CommonStatusEnum 枚举', required: true, example: 1 })
  @IsNumber()
  status: number;

}
