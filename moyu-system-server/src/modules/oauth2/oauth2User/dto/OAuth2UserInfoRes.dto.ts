import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OAuth2UserDeptDTO } from './OAuth2UserDept.dto';
import { OAuth2UserPostDTO } from './OAuth2UserPost.dto';

/**
 * OAuth2 获得用户基本信息
 */
export class OAuth2UserInfoResDTO {
  @ApiProperty({ description: '用户编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户账号', required: true, example: 'moyu' })
  @IsString()
  username: string;

  @ApiProperty({ description: '用户昵称', required: true, example: 'moyu' })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '用户邮箱',
    required: false,
    example: 'moyu@qq.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: '手机号码',
    required: false,
    example: '15601691300',
  })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '用户性别', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({
    description: '用户头像',
    required: false,
    example: 'https://www.moyu.cn/xxx.png',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: '所在部门',
    required: false,
    type: OAuth2UserDeptDTO,
  })
  @IsOptional()
  dept?: OAuth2UserDeptDTO;

  @ApiProperty({
    description: '所属岗位数组',
    required: false,
    type: [OAuth2UserPostDTO],
  })
  @IsOptional()
  @IsArray()
  posts?: OAuth2UserPostDTO[];
}
