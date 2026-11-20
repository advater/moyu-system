import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户个人中心更新密码
 */
export class UserProfileUpdatePasswordReqDTO {
  @ApiProperty({ description: '旧密码', required: true, example: '123456' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码', required: true, example: '654321' })
  @IsString()
  newPassword: string;

}
