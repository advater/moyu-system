import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class ApiAccessLogPageReqDTO extends PageParam {
  @ApiProperty({ description: '请求地址', required: false })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiProperty({ description: '用户编号', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '应用名', required: false })
  @IsOptional()
  @IsString()
  applicationName?: string;
}
