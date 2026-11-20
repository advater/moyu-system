import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class JobPageReqDTO extends PageParam {
  @ApiProperty({ description: '任务名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '处理器名字', required: false })
  @IsOptional()
  @IsString()
  handlerName?: string;

  @ApiProperty({ description: '状态：0 停用 / 1 启用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
