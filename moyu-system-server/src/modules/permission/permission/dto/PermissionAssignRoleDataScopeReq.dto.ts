import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 赋予角色数据权限
 */
export class PermissionAssignRoleDataScopeReqDTO {
  @ApiProperty({ description: '角色编号', required: true, example: 1 })
  @IsNumber()
  roleId: number;

  @ApiProperty({ description: '数据范围', required: true, example: 1 })
  @IsNumber()
  dataScope: number;

  @ApiProperty({ description: '部门编号列表，只有范围类型为 DEPT_CUSTOM 时，该字段才需要', required: false, example: ["1,3,5"] })
  @IsOptional()
  @IsArray()
  dataScopeDeptIds?: number[];

}
