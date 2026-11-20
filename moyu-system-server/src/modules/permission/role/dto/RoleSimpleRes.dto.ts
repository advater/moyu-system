import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 角色精简信息
 */
export class RoleSimpleResDTO {
  @ApiProperty({ description: '角色编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '角色名称', required: true, example: 'moyu' })
  @IsString()
  name: string;

}
