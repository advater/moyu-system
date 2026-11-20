import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户信息
 */
export class UserResDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户账号', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '用户昵称', required: true, example: 'moyu' })
  @IsString()
  nickname: string;

  @ApiProperty({ description: '备注', required: false, example: '我是一个用户' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '部门ID', required: false, example: '我是一个用户' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ description: '部门名称', required: false, example: 'IT 部' })
  @IsOptional()
  @IsString()
  deptName?: string;

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

  @ApiProperty({ description: '状态类', required: true, example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '最后登录 IP', required: true, example: '192.168.1.1' })
  @IsString()
  loginIp: string;

  @ApiProperty({ description: '最后登录时间', required: true, example: '时间戳格式' })
  @IsString()
  loginDate: string;

  @ApiProperty({ description: '创建时间', required: true, example: '时间戳格式' })
  @IsString()
  createTime: string;

}
