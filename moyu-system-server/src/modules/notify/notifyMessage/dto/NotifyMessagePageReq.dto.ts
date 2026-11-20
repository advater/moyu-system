import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信分页
 */
export class NotifyMessagePageReqDTO extends PageParam {
  @ApiProperty({
    description: '用户编号',
    required: false,
    example: 25025,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: '用户类型',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  userType?: number;

  @ApiProperty({
    description: '模板编码',
    required: false,
    example: 'test_01',
  })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiProperty({
    description: '模版类型',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  templateType?: number;

  @ApiProperty({
    description: '创建时间',
    required: false,
    example: ['2023-08-01', '2023-08-02'],
  })
  @IsOptional()
  @IsArray()
  createTime?: string[];
}
