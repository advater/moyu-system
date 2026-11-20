import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信模版分页
 */
export class NotifyTemplatePageReqDTO extends PageParam {
  @ApiProperty({
    description: '模版编码',
    required: false,
    example: 'test_01',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: '模版名称',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({
    description: '创建时间',
    required: false,
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
