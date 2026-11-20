import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleSimpleResDTO } from '@/modules/permission/role/dto/role.dto';
import { DeptSimpleResDTO } from '@/modules/dept/dept/dto/dept.dto';
import { PostSimpleResDTO } from '@/modules/dept/post/dto/post.dto';

/**
 * 用户个人中心信息
 */
export class UserProfileResDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户账号', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '用户昵称', required: false, example: 'moyu' })
  @IsOptional()
  @IsString()
  nickname?: string;

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

  @ApiProperty({ description: '最后登录 IP', required: true, example: '192.168.1.1' })
  @IsString()
  loginIp: string;

  @ApiProperty({ description: '最后登录时间', required: true, example: '时间戳格式' })
  @IsString()
  loginDate: string;

  @ApiProperty({ description: '创建时间', required: true, example: '时间戳格式' })
  @IsString()
  createTime: string;

  @ApiProperty({ description: '所属角色', required: false })
  @IsOptional()
  @IsArray()
  roles?: RoleSimpleResDTO[];

  @ApiProperty({ description: '所在部门', required: false })
  @IsOptional()
  dept?: DeptSimpleResDTO;

  @ApiProperty({ description: '所属岗位数组', required: false })
  @IsOptional()
  @IsArray()
  posts?: PostSimpleResDTO[];

}
