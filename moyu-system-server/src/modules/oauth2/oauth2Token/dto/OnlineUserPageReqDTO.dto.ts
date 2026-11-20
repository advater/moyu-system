
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';
import {
  EmptyToUndefined,
  ToOptionalNumber,
} from '@/common/transform/query.transformer';

export class OnlineUserPageReqDTO extends PageParam {
  @ApiProperty({ description: '用户编号', required: false })
  @IsOptional()
  @ToOptionalNumber()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '用户类型', required: false })
  @IsOptional()
  @ToOptionalNumber()
  @IsNumber()
  userType?: number;

  @ApiProperty({ description: '客户端编号', required: false })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  clientId?: string;
}
