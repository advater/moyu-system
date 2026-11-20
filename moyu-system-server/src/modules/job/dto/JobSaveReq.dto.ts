import { ValidationError } from '@/config/error-messages';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class JobSaveReqDTO {
  @ApiProperty({ description: '任务编号', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: '任务名称', example: '清理过期令牌' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.JOB_NAME_REQUIRED })
  @MaxLength(64)
  name: string;

  @ApiProperty({ description: '处理器名字', example: 'system.cleanExpiredTokens' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.JOB_HANDLER_REQUIRED })
  @MaxLength(64)
  handlerName: string;

  @ApiProperty({ description: '处理器参数', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  handlerParam?: string;

  @ApiProperty({ description: 'CRON 表达式', example: '0 0 * * * *' })
  @IsString()
  @IsNotEmpty({ message: ValidationError.CRON_REQUIRED })
  @MaxLength(64)
  cronExpression: string;

  @ApiProperty({ description: '重试次数', example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retryCount: number;

  @ApiProperty({ example: 0, description: '重试间隔（秒）' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retryInterval: number;

  @ApiProperty({ example: 0, description: '监控超时（秒），0 不监控' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monitorTimeout: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
