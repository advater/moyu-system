import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';
import {
  EmptyToUndefined,
  ToOptionalNumber,
} from '@/common/transform/query.transformer';

/**
 * 访问令牌分页（筛选条件均可选）
 */
export class OAuth2TokenPageReqDTO extends PageParam {
  @ApiProperty({
    description: '用户编号',
    required: false,
    example: 666,
  })
  @IsOptional()
  @ToOptionalNumber()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: '用户类型',
    required: false,
    example: 2,
  })
  @IsOptional()
  @ToOptionalNumber()
  @IsNumber()
  userType?: number;

  @ApiProperty({
    description: '客户端编号',
    required: false,
    example: '2',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  clientId?: string;
}
