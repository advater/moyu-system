import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 客户端分页
 */
export class OAuth2ClientPageReqDTO extends PageParam {
  @ApiProperty({
    description: '应用名，模糊匹配',
    required: false,
    example: 'moyu',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '状态',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}
