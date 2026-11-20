import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 赋予用户角色
 */
export class PermissionAssignUserRoleReqDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '角色编号列表', required: false, example: ["1,3,5"] })
  @IsOptional()
  @IsArray()
  roleIds?: number[];

}
