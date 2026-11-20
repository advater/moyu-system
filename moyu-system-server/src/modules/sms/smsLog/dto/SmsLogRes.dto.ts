import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 短信日志
 */
export class SmsLogResDTO {
  @ApiProperty({ description: '编号', required: true, example: 1024 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '短信渠道编号', required: true, example: 10 })
  @IsNumber()
  channelId: number;

  @ApiProperty({ description: '短信渠道编码', required: true, example: 'ALIYUN' })
  @IsString()
  channelCode: string;

  @ApiProperty({ description: '模板编号', required: true, example: 20 })
  @IsNumber()
  templateId: number;

  @ApiProperty({ description: '模板编码', required: true, example: 'test-01' })
  @IsString()
  templateCode: string;

  @ApiProperty({ description: '短信类型', required: true, example: 1 })
  @IsNumber()
  templateType: number;

  @ApiProperty({ description: '短信内容', required: true, example: '你好，你的验证码是 1024' })
  @IsString()
  templateContent: string;

  @ApiProperty({ description: '短信参数', required: true, example: 'name,code' })
  @IsObject()
  templateParams: Record<string, any>;

  @ApiProperty({ description: '短信 API 的模板编号', required: true, example: 'SMS_207945135' })
  @IsString()
  apiTemplateId: string;

  @ApiProperty({ description: '手机号', required: true, example: '15601691300' })
  @IsString()
  mobile: string;

  @ApiProperty({ description: '用户编号', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '用户类型', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  userType?: number;

  @ApiProperty({ description: '发送状态', required: true, example: 1 })
  @IsNumber()
  sendStatus: number;

  @ApiProperty({ description: '发送时间', required: false })
  @IsOptional()
  @IsString()
  sendTime?: string;

  @ApiProperty({ description: '短信 API 发送结果的编码', required: false, example: 'SUCCESS' })
  @IsOptional()
  @IsString()
  apiSendCode?: string;

  @ApiProperty({ description: '短信 API 发送失败的提示', required: false, example: '成功' })
  @IsOptional()
  @IsString()
  apiSendMsg?: string;

  @ApiProperty({ description: '短信 API 发送返回的唯一请求 ID', required: false, example: '3837C6D3-B96F-428C-BBB2-86135D4B5B99' })
  @IsOptional()
  @IsString()
  apiRequestId?: string;

  @ApiProperty({ description: '短信 API 发送返回的序号', required: false, example: '62923244790' })
  @IsOptional()
  @IsString()
  apiSerialNo?: string;

  @ApiProperty({ description: '接收状态', required: true, example: 0 })
  @IsNumber()
  receiveStatus: number;

  @ApiProperty({ description: '接收时间', required: false })
  @IsOptional()
  @IsString()
  receiveTime?: string;

  @ApiProperty({ description: 'API 接收结果的编码', required: false, example: 'DELIVRD' })
  @IsOptional()
  @IsString()
  apiReceiveCode?: string;

  @ApiProperty({ description: 'API 接收结果的说明', required: false, example: '用户接收成功' })
  @IsOptional()
  @IsString()
  apiReceiveMsg?: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
