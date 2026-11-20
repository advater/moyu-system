import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class JobLogPageReqDTO extends PageParam {
  @ApiProperty({ description: '任务编号', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  jobId?: number;

  @ApiProperty({ description: '处理器名字', required: false })
  @IsOptional()
  @IsString()
  handlerName?: string;

  @ApiProperty({ description: '状态：0 成功 / 1 失败', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
