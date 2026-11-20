import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

export class FilePageReqDTO extends PageParam {
  @ApiProperty({ description: '文件名，模糊匹配', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiProperty({ description: 'MIME 类型前缀，如 image/', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
