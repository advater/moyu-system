import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 地区节点响应
 */
export class AreaNodeResDTO {
  @ApiProperty({ description: '编号', required: true, example: '110000' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '名字', required: true, example: '北京' })
  @IsString()
  name: string;

  @ApiProperty({ description: '子节点', required: false })
  @IsOptional()
  @IsArray()
  children?: AreaNodeResDTO[];
}
