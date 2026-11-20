import { ApiProperty } from '@nestjs/swagger';
import { AuthMenuResDTO } from './AuthMenuRes.dto';
import { AuthUserResDTO } from './AuthUserRes.dto';

/**
 * 登录用户的权限信息响应
 */
export class AuthPermissionInfoResDTO {
  @ApiProperty({
    description: '用户信息',
    required: true,
    type: AuthUserResDTO,
  })
  user: AuthUserResDTO;

  @ApiProperty({
    description: '角色标识数组',
    required: true,
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: '操作权限数组',
    required: true,
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: '菜单树',
    required: true,
    type: AuthMenuResDTO,
    isArray: true,
  })
  menus: AuthMenuResDTO[];
}
