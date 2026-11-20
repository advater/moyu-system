import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 菜单信息
 */
export class MenuResDTO {
  @ApiProperty({ description: '菜单编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '菜单名称', required: true, example: 'moyu' })
  @IsString()
  name: string;

  @ApiProperty({ description: '权限标识,仅菜单类型为按钮时，才需要传递', required: false, example: 'sys:menu:add' })
  @IsOptional()
  @IsString()
  permission?: string;

  @ApiProperty({ description: '类型', required: true, example: 1 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '显示顺序', required: true, example: 1024 })
  @IsNumber()
  sort: number;

  @ApiProperty({ description: '父菜单 ID', required: true, example: 1024 })
  @IsNumber()
  parentId: number;

  @ApiProperty({ description: '路由地址,仅菜单类型为菜单或者目录时，才需要传', required: false, example: '/admin/post' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: '菜单图标,仅菜单类型为菜单或者目录时，才需要传', required: false, example: '/menu/list' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '组件路径,仅菜单类型为菜单时，才需要传', required: false, example: 'system/post/index' })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ description: '组件名', required: false, example: 'SystemUser' })
  @IsOptional()
  @IsString()
  componentName?: string;

  @ApiProperty({ description: '状态,见 CommonStatusEnum 枚举', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '是否可见', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiProperty({ description: '是否缓存', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean;

  @ApiProperty({ description: '是否总是显示', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  alwaysShow?: boolean;

  @ApiProperty({ description: '创建时间', required: true, example: '时间戳格式' })
  @IsString()
  createTime: string;

}
