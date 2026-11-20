import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 用户信息中的岗位摘要
 */
export class OAuth2UserPostDTO {
  @ApiProperty({ description: '岗位编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '岗位名称', required: true, example: '开发' })
  @IsString()
  name: string;
}
