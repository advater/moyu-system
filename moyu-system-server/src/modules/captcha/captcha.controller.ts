import { Controller, Get, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CaptchaService } from './captcha.service';
import { CaptchaReqDTO } from './dto/captcha.dto';
import { SkipAuth } from '@/common/decorator/auth.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * 验证码 Controller
 */
@ApiTags('验证码')
@Controller()
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('get')
  @SkipAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '获得验证码' })
  @ApiResponse({ status: 200, description: '成功获取验证码' })
  get() {
    return this.captchaService.get();
  }

  @Post('check')
  @SkipAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: '校验验证码' })
  @ApiResponse({ status: 200, description: '成功校验验证码' })
  check(@Body() req: CaptchaReqDTO) {
    return this.captchaService.check(req);
  }
}
