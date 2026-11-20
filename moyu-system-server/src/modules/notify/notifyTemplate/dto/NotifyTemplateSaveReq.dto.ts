import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信模版创建/修改
 */
export class NotifyTemplateSaveReqDTO {
  @ApiProperty({
    description: 'ID',
    required: false,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: '模版名称',
    required: true,
    example: '测试模版',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '模版编码',
    required: true,
    example: 'SEND_TEST',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: '模版类型',
    required: true,
    example: 1,
  })
  @IsNumber()
  type: number;

  @ApiProperty({
    description: '发送人名称',
    required: true,
    example: 'moyu',
  })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '模版内容',
    required: true,
    example: '我是模版内容',
  })
  @IsString()
  content: string;

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
    example: '我是备注',
  })
  @IsOptional()
  @IsString()
  remark?: string;
}
