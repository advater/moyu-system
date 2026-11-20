import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信模板的发送
 */
export class SmsTemplateSendReqDTO {
  @ApiProperty({ description: '手机号', required: true, example: '15601691300' })
  @IsString()
  mobile: string;

  @ApiProperty({ description: '模板编码', required: true, example: 'test_01' })
  @IsString()
  templateCode: string;

  @ApiProperty({ description: '模板参数', required: false })
  @IsOptional()
  @IsObject()
  templateParams?: Record<string, any>;

}
