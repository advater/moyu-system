import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户导入 Excel 行
 */
export class UserImportExcelDTO {
  @ApiProperty({ description: '用户账号', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '用户昵称', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '部门编号', required: false })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ description: '用户邮箱', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: '手机号码', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '用户性别', required: false })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({ description: '帐号状态', required: false })
  @IsOptional()
  @IsNumber()
  status?: number;
}
