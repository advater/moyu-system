import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** 占位：Swagger 用 */
export class FileCreateReqDTO {
  @ApiProperty({ description: '文件路径', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path?: string;
}
