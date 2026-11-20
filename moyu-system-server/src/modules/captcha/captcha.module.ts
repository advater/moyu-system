import { Module } from '@nestjs/common';
import { RedisModule } from '@/plugins/redis/redis.module';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';

/**
 * 验证码 Module
 */
@Module({
  imports: [RedisModule],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
