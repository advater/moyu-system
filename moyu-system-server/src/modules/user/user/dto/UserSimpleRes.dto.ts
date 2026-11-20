import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户精简信息
 */
export class UserSimpleResDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户昵称', required: true, example: 'moyu' })
  @IsString()
  nickname: string;

  @ApiProperty({ description: '头像', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '性别', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({ description: '部门ID', required: false, example: '我是一个用户' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ description: '部门名称', required: false, example: 'IT 部' })
  @IsOptional()
  @IsString()
  deptName?: string;

}
