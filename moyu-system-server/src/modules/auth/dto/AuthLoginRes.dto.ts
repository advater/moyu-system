import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录响应
 */
export class AuthLoginResDTO {
  @ApiProperty({
    description: '用户编号',
    required: true,
    example: 1024,
  })
  userId: number;

  @ApiProperty({
    description: '访问令牌',
    required: true,
    example: 'happy',
  })
  accessToken: string;

  @ApiProperty({
    description: '刷新令牌',
    required: true,
    example: 'nice',
  })
  refreshToken: string;

  @ApiProperty({
    description: '过期时间',
    required: true,
    example: '2029-12-31 23:59:59',
  })
  expiresTime: Date;

  @ApiProperty({
    description: '是否必须修改密码',
    required: false,
    example: false,
  })
  mustChangePassword?: boolean;
}
