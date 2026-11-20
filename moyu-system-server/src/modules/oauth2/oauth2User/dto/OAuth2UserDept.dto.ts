import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 用户信息中的部门摘要
 */
export class OAuth2UserDeptDTO {
  @ApiProperty({ description: '部门编号', required: true, example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '部门名称', required: true, example: '研发部' })
  @IsString()
  name: string;
}
