import { IsArray, IsBoolean, IsOptional } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信分页
 */
export class NotifyMessageMyPageReqDTO extends PageParam {
  @ApiProperty({
    description: '是否已读',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readStatus?: boolean;

  @ApiProperty({
    description: '创建时间',
    required: false,
    example: ['2023-08-01', '2023-08-02'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
