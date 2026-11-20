import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApiErrorLogProcessReqDTO {
  @ApiProperty({ description: '日志编号' })
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiProperty({ description: '处理状态：1 已处理 / 2 已忽略' })
  @Type(() => Number)
  @IsNumber()
  processStatus: number;
}
