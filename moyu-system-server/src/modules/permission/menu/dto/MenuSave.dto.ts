import { Allow, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ToBoolean } from '@/common/transform/query.transformer';

/**
 * 菜单创建/修改
 *
 * 前端修改时会把 GET /menu/get 的结果原样 PUT 回来（含 createTime / children），
 * 全局 ValidationPipe forbidNonWhitelisted=true，未声明字段会直接 400。
 */
export class MenuSaveDTO {
  @ApiProperty({ description: '菜单编号', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  id?: number;

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
  @ToBoolean()
  visible?: boolean;

  @ApiProperty({ description: '是否缓存', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  keepAlive?: boolean;

  @ApiProperty({ description: '是否总是显示', required: false, example: false })
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  alwaysShow?: boolean;

  /** 详情回写字段，不落库 */
  @ApiProperty({ description: '创建时间（修改回写忽略）', required: false })
  @IsOptional()
  @Allow()
  createTime?: string;

  /** 树节点回写字段，不落库 */
  @ApiProperty({ description: '子菜单（修改回写忽略）', required: false })
  @IsOptional()
  @Allow()
  children?: unknown;

}
