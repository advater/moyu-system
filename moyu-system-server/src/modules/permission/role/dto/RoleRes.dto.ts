import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 角色信息
 */
export class RoleResDTO {
  @ApiProperty({ description: '角色编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '角色名称', required: true, example: '管理员' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色标志', required: true, example: 'admin' })
  @IsString()
  code: string;

  @ApiProperty({ description: '显示顺序', required: true, example: 1024 })
  @IsNumber()
  sort: number;

  @ApiProperty({ description: '状态类', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '角色类型类', required: true, example: 1 })
  @IsNumber()
  type: number;

  @ApiProperty({ description: '备注', required: false, example: '我是一个角色' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '数据范围类', required: true, example: 1 })
  @IsNumber()
  dataScope: number;

  @ApiProperty({ description: '数据范围(指定部门数组)', required: false, example: ["1"] })
  @IsOptional()
  @IsArray()
  dataScopeDeptIds?: number[];

  @ApiProperty({ description: '创建时间', required: true, example: '时间戳格式' })
  @IsString()
  createTime: string;

}
