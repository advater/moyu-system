import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorLogPageReqDTO extends PageParam {
  @ApiProperty({ description: '请求地址', required: false })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiProperty({ description: '处理状态：0 未处理 / 1 已处理 / 2 已忽略', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  processStatus?: number;

  @ApiProperty({ description: '异常名', required: false })
  @IsOptional()
  @IsString()
  exceptionName?: string;
}
