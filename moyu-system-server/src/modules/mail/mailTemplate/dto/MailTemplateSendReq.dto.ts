import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮件发送 Req DTO
 */
export class MailTemplateSendReqDTO {
  @ApiProperty({
    description: '接收邮箱',
    required: true,
    example: '[user1@example.com, user2@example.com]',
  })
  @IsArray()
  toMails: string[];

  @ApiProperty({
    description: '抄送邮箱',
    required: true,
    example: '[user3@example.com, user4@example.com]',
  })
  @IsArray()
  ccMails: string[];

  @ApiProperty({
    description: '密送邮箱',
    required: true,
    example: '[user5@example.com, user6@example.com]',
  })
  @IsArray()
  bccMails: string[];

  @ApiProperty({
    description: '模板编码',
    required: true,
    example: 'test_01',
  })
  @IsString()
  templateCode: string;

  @ApiProperty({
    description: '模板参数',
    required: false,
  })
  @IsOptional()
  @IsObject()
  templateParams?: Record<string, any>;
}
