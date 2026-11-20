import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮件日志
 */
export class MailLogResDTO {
  @ApiProperty({ description: '编号', required: true, example: 31020 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '用户编号', required: false, example: 30883 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '用户类型', required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  userType?: number;

  @ApiProperty({ description: '接收邮箱地址', required: true, example: ["user1@example.com, user2@example.com"] })
  @IsArray()
  toMails: string[];

  @ApiProperty({ description: '抄送邮箱地址', required: true, example: ["user3@example.com, user4@example.com"] })
  @IsArray()
  ccMails: string[];

  @ApiProperty({ description: '密送邮箱地址', required: true, example: ["user5@example.com, user6@example.com"] })
  @IsArray()
  bccMails: string[];

  @ApiProperty({ description: '邮箱账号编号', required: true, example: 18107 })
  @IsNumber()
  accountId: number;

  @ApiProperty({ description: '发送邮箱地址', required: true, example: '85757@qq.com' })
  @IsString()
  fromMail: string;

  @ApiProperty({ description: '模板编号', required: true, example: 5678 })
  @IsNumber()
  templateId: number;

  @ApiProperty({ description: '模板编码', required: true, example: 'test_01' })
  @IsString()
  templateCode: string;

  @ApiProperty({ description: '模版发送人名称', required: false, example: '李四' })
  @IsOptional()
  @IsString()
  templateNickname?: string;

  @ApiProperty({ description: '邮件标题', required: true, example: '测试标题' })
  @IsString()
  templateTitle: string;

  @ApiProperty({ description: '邮件内容', required: true, example: '测试内容' })
  @IsString()
  templateContent: string;

  @ApiProperty({ description: '邮件参数', required: true })
  @IsObject()
  templateParams: Record<string, any>;

  @ApiProperty({ description: '发送状态', required: true, example: 1 })
  @IsNumber()
  sendStatus: number;

  @ApiProperty({ description: '发送时间', required: false })
  @IsOptional()
  @IsString()
  sendTime?: string;

  @ApiProperty({ description: '发送返回的消息 ID', required: false, example: '28568' })
  @IsOptional()
  @IsString()
  sendMessageId?: string;

  @ApiProperty({ description: '发送异常', required: false })
  @IsOptional()
  @IsString()
  sendException?: string;

  @ApiProperty({ description: '创建时间', required: true })
  @IsString()
  createTime: string;

}
