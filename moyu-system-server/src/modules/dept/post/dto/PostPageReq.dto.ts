import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 岗位分页查询参数
 */
export class PostPageReqDTO extends PageParam {
  @ApiProperty({
    description: '岗位编码，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: '岗位名称，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '展示状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
