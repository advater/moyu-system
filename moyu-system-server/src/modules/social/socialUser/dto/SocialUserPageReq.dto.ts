import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交用户分页
 */
export class SocialUserPageReqDTO extends PageParam {
  @ApiProperty({ description: '社交平台的类型', required: false, example: 30 })
  @IsOptional()
  @IsNumber()
  type?: number;

  @ApiProperty({ description: '用户昵称', required: false, example: '李四' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '社交 openid', required: false, example: 'oz-Jdt0kd_jdhUxJHQdBJMlOFN7w' })
  @IsOptional()
  @IsString()
  openid?: string;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  @IsArray()
  createTime?: string[];

}
