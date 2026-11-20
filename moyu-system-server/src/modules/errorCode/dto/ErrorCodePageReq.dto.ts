import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorCodePageReqDTO extends PageParam {
  @ApiProperty({ description: '错误码', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  code?: number;

  @ApiProperty({ description: '应用名', required: false })
  @IsOptional()
  @IsString()
  applicationName?: string;

  @ApiProperty({ description: '错误提示，模糊匹配', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
