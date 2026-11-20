import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户创建/修改
 */
export class UserSaveReqDTO {
  @ApiProperty({ description: '用户编号', required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '用户账号', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '用户昵称（可选，缺省回落账号）', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '备注', required: false, example: '我是一个用户' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '部门编号', required: false, example: '我是一个用户' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ description: '岗位编号数组', required: false, example: ["1"] })
  @IsOptional()
  @IsArray()
  postIds?: number[];

  @ApiProperty({ description: '用户邮箱', required: false, example: 'moyu@qq.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: '手机号码', required: false, example: '15601691300' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '用户性别', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({ description: '用户头像', required: false, example: 'https://www.moyu.cn/xxx.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '密码', required: true, example: '123456' })
  @IsString()
  password: string;

}
