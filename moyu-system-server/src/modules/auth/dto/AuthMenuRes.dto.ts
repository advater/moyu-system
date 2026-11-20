import { ApiProperty } from '@nestjs/swagger';

/**
 * 菜单响应
 */
export class AuthMenuResDTO {
  @ApiProperty({
    description: '菜单编号',
    required: true,
    example: 1024,
  })
  id: number;

  @ApiProperty({
    description: '父菜单 ID',
    required: true,
    example: 0,
  })
  parentId: number;

  @ApiProperty({
    description: '菜单名称',
    required: true,
    example: 'moyu',
  })
  name: string;

  @ApiProperty({
    description: '路由地址,仅菜单类型为菜单或者目录时，才需要传',
    example: '/admin/post',
  })
  path?: string;

  @ApiProperty({
    description: '组件路径,仅菜单类型为菜单时，才需要传',
    example: 'system/post/index',
  })
  component?: string;

  @ApiProperty({
    description: '组件名',
    example: 'SystemUser',
  })
  componentName?: string;

  @ApiProperty({
    description: '菜单图标,仅菜单类型为菜单或者目录时，才需要传',
    example: '/menu/list',
  })
  icon?: string;

  @ApiProperty({
    description: '是否可见',
    required: true,
    example: true,
  })
  visible: boolean;

  @ApiProperty({
    description: '是否缓存',
    required: true,
    example: false,
  })
  keepAlive: boolean;

  @ApiProperty({
    description: '是否总是显示',
    example: false,
  })
  alwaysShow?: boolean;

  @ApiProperty({
    description: '子路由',
    required: false,
    type: () => AuthMenuResDTO,
    isArray: true,
  })
  children?: AuthMenuResDTO[];
}
