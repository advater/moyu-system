import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 菜单精简信息
 */
export class MenuSimpleResDTO {
  @ApiProperty({ description: '菜单编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '菜单名称', required: true, example: 'moyu' })
  @IsString()
  name: string;

  @ApiProperty({ description: '父菜单 ID', required: true, example: 1024 })
  @IsNumber()
  parentId: number;

  @ApiProperty({ description: '类型', required: true, example: 1 })
  @IsNumber()
  type: number;

}
