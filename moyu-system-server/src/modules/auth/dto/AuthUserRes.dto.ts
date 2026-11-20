import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录用户权限信息中的用户摘要
 */
export class AuthUserResDTO {
  @ApiProperty({
    description: '用户编号',
    required: true,
    example: 1024,
  })
  id: number;

  @ApiProperty({
    description: '用户昵称',
    required: true,
    example: 'moyu',
  })
  nickname: string;

  @ApiProperty({
    description: '用户头像',
    required: true,
    example: 'https://www.moyu.cn/xx.jpg',
  })
  avatar: string;

  @ApiProperty({
    description: '部门编号',
    required: true,
    example: 2048,
  })
  deptId: number;

  @ApiProperty({
    description: '用户账号',
    required: true,
    example: 'moyu',
  })
  username: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'moyu@qq.com',
  })
  email?: string;
}
