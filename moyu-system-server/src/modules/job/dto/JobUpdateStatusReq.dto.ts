import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class JobUpdateStatusReqDTO {
  @ApiProperty({ description: '任务编号', example: 1 })
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1, description: '状态：0 停用 / 1 启用' })
  @Type(() => Number)
  @IsNumber()
  status: number;
}
