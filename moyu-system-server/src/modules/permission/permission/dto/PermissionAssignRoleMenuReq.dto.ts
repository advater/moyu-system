import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 赋予角色菜单
 */
export class PermissionAssignRoleMenuReqDTO {
  @ApiProperty({ description: '角色编号', required: true, example: 1 })
  @IsNumber()
  roleId: number;

  @ApiProperty({ description: '菜单编号列表', required: false, example: ["1,3,5"] })
  @IsOptional()
  @IsArray()
  menuIds?: number[];

}
