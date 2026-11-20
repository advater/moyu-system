import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { SmsCallbackService } from './smsCallback.service';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { SkipAuth } from '@/common/decorator/auth.decorator';
import type { FastifyRequest } from 'fastify';

/**
 * 短信回调 Controller
 *
 * - Header `x-sms-callback-token` = SMS_CALLBACK_SECRET（禁止 Query）
 * - 可选 `x-sms-signature` = 通用 HMAC
 * - 腾讯可选 `x-tc-signature`；阿里可选 `x-acs-signature`
 */
@ApiTags('短信回调')
@Controller()
export class SmsCallbackController {
  constructor(private readonly smsCallbackService: SmsCallbackService) {}

  private authorize(
    headerToken: string | undefined,
    hmacSignature: string | undefined,
    vendorSignature: string | undefined,
    rawBody: string | Buffer | undefined,
    vendor: 'aliyun' | 'tencent' | 'huawei' | 'qiniu',
  ): void {
    this.smsCallbackService.assertCallbackAuthorized(
      headerToken?.trim(),
      hmacSignature,
      rawBody,
      vendor,
      vendorSignature,
    );
  }

  private rawBody(req: FastifyRequest): string | Buffer | undefined {
    const anyReq = req as FastifyRequest & { rawBody?: string | Buffer };
    if (anyReq.rawBody != null) return anyReq.rawBody;
    return typeof anyReq.body === 'string'
      ? anyReq.body
      : JSON.stringify(anyReq.body ?? '');
  }

  @Post('aliyun')
  @SkipAuth()
  @ApiHeader({ name: 'x-sms-callback-token', required: false })
  @ApiHeader({ name: 'x-sms-signature', required: false })
  @ApiHeader({ name: 'x-acs-signature', required: false })
  @ApiOperation({ summary: '阿里云短信的回调' })
  @ApiResponse({ status: 200, description: '成功返回aliyun短信回调结果' })
  receiveAliyunSmsStatus(
    @Body() body: unknown,
    @Req() req: FastifyRequest,
    @Headers('x-sms-callback-token') headerToken?: string,
    @Headers('x-sms-signature') hmacSig?: string,
    @Headers('x-acs-signature') vendorSig?: string,
  ) {
    this.authorize(headerToken, hmacSig, vendorSig, this.rawBody(req), 'aliyun');
    return this.smsCallbackService.receiveAliyunSmsStatus(body);
  }

  @Post('tencent')
  @SkipAuth()
  @ApiHeader({ name: 'x-sms-callback-token', required: false })
  @ApiHeader({ name: 'x-sms-signature', required: false })
  @ApiHeader({ name: 'x-tc-signature', required: false })
  @ApiOperation({ summary: '腾讯云短信的回调' })
  @ApiResponse({ status: 200, description: '成功返回腾讯短信回调结果' })
  receiveTencentCloudSmsStatus(
    @Body() body: unknown,
    @Req() req: FastifyRequest,
    @Headers('x-sms-callback-token') headerToken?: string,
    @Headers('x-sms-signature') hmacSig?: string,
    @Headers('x-tc-signature') vendorSig?: string,
  ) {
    this.authorize(
      headerToken,
      hmacSig,
      vendorSig,
      this.rawBody(req),
      'tencent',
    );
    return this.smsCallbackService.receiveTencentCloudSmsStatus(body);
  }

  @Post('huawei')
  @SkipAuth()
  @ApiHeader({ name: 'x-sms-callback-token', required: false })
  @ApiHeader({ name: 'x-sms-signature', required: false })
  @ApiOperation({ summary: '华为云短信的回调' })
  @ApiResponse({ status: 200, description: '成功返回华为短信回调结果' })
  receiveHuaweiSmsStatus(
    @Body() body: unknown,
    @Req() req: FastifyRequest,
    @Headers('x-sms-callback-token') headerToken?: string,
    @Headers('x-sms-signature') hmacSig?: string,
  ) {
    this.authorize(headerToken, hmacSig, undefined, this.rawBody(req), 'huawei');
    return this.smsCallbackService.receiveHuaweiSmsStatus(body);
  }

  @Post('qiniu')
  @SkipAuth()
  @ApiHeader({ name: 'x-sms-callback-token', required: false })
  @ApiHeader({ name: 'x-sms-signature', required: false })
  @ApiOperation({ summary: '七牛云短信的回调' })
  @ApiResponse({ status: 200, description: '成功返回七牛短信回调结果' })
  receiveQiniuSmsStatus(
    @Body() body: unknown,
    @Req() req: FastifyRequest,
    @Headers('x-sms-callback-token') headerToken?: string,
    @Headers('x-sms-signature') hmacSig?: string,
  ) {
    this.authorize(headerToken, hmacSig, undefined, this.rawBody(req), 'qiniu');
    return this.smsCallbackService.receiveQiniuSmsStatus(body);
  }
}
