import { IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';
import { EmptyToUndefined } from '@/common/transform/query.transformer';

/**
 * 邮箱账号分页（筛选条件均可选）
 */
export class MailAccountPageReqDTO extends PageParam {
  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'moyuma@123.com',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  mail?: string;

  @ApiProperty({
    description: '用户名',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  username?: string;
}
