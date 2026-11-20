import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ToOptionalNumber } from '@/common/transform/query.transformer';

/**
 * 未读站内信列表查询。size 来自 Query，必须走 DTO 才能被 ValidationPipe 转成 number。
 */
export class NotifyMessageUnreadListReqDTO {
  @ApiProperty({
    description: '返回条数',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @ToOptionalNumber()
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 10;
}
