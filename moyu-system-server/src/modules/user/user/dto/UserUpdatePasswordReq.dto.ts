import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户更新密码
 */
export class UserUpdatePasswordReqDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '密码', required: true, example: '123456' })
  @IsString()
  password: string;

}
