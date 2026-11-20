import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 站内信模板的发送
 */
export class NotifyTemplateSendReqDTO {
  @ApiProperty({
    description: '用户id',
    required: true,
    example: '01',
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '用户类型',
    required: true,
    example: 1,
  })
  @IsNumber()
  userType: number;

  @ApiProperty({
    description: '模板编码',
    required: true,
    example: '01',
  })
  @IsString()
  templateCode: string;

  @ApiProperty({
    description: '模板参数',
    required: false,
    example: '101',
  })
  @IsOptional()
  @IsObject()
  templateParams?: Record<string, any>;
}
