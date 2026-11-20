import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 通知公告分页
 */
export class NoticePageReqDTO extends PageParam {
  @ApiProperty({
    description: '通知公告名称，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
