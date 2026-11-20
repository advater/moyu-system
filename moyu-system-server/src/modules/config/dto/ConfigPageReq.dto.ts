import { IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigPageReqDTO extends PageParam {
  @ApiProperty({ description: '参数名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '参数键名', required: false })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiProperty({ description: '分组', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
