import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 角色创建/更新
 */
export class RoleSaveReqDTO {
  @ApiProperty({ description: '角色编号', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '角色名称', required: true, example: '管理员' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色标志', required: true, example: 'ADMIN' })
  @IsString()
  code: string;

  @ApiProperty({ description: '显示顺序', required: true, example: 1024 })
  @IsNumber()
  sort: number;

  @ApiProperty({ description: '状态', required: true, example: 0 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '备注', required: false, example: '我是一个角色' })
  @IsOptional()
  @IsString()
  remark?: string;

}
