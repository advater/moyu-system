import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 岗位创建/修改参数
 */
export class PostSaveReqDTO {
  @ApiProperty({
    description: '岗位编号',
    required: true,
    example: 1024,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '岗位名称',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.POST_NAME_REQUIRED })
  @IsString()
  name: string;

  @ApiProperty({
    description: '岗位编码',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.POST_CODE_REQUIRED })
  @IsString()
  code: string;

  @ApiProperty({
    description: '显示顺序',
    required: true,
    example: 1024,
  })
  @IsNumber()
  sort: number;

  @ApiProperty({
    description: '状态',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: '备注',
    required: false,
    example: '备注123',
  })
  @IsOptional()
  @IsString()
  remark?: string;
}
