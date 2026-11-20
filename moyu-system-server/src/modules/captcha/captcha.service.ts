import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CaptchaError } from '@/config/error-messages';
import { randomUUID } from 'crypto';
import { RedisService } from '@/plugins/redis/redis.service';
import { CaptchaReqDTO, CaptchaResDTO } from './dto/captcha.dto';
import { createMath, createText } from '@/plugins/captcha/captcha.service';
import { CAPTCHA_CODE_PREFIX, CAPTCHA_CODE_EXPIRE } from '@/config/constants';

/**
 * 验证码管理 Service
 *
 * 验证码为「一次性」使用：生成后写入 Redis（默认 5 分钟过期），
 * 校验通过后立即删除，避免同一验证码被反复提交。
 */
@Injectable()
export class CaptchaService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 生成验证码
   *
   * 随机生成「文本验证码 / 数学验证码」，答案统一转小写存入 Redis，
   * 以 uuid 作为取回凭证返回给前端。
   */
  async get(): Promise<CaptchaResDTO> {
    const uuid = randomUUID();
    // 50% 概率生成数学运算验证码，其余生成文本验证码
    const captcha = Math.random() > 0.5 ? createMath() : createText();
    const code = String(captcha.text).toLowerCase();
    await this.redisService.set(`${CAPTCHA_CODE_PREFIX}:${uuid}`, code, CAPTCHA_CODE_EXPIRE);
    const image = `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;
    return { uuid, image };
  }

  /**
   * 校验验证码
   *
   * 校验通过后删除 Redis 中的验证码（一次性使用）。
   */
  async check(req: CaptchaReqDTO): Promise<boolean> {
    const { uuid, code } = req;
    if (!uuid || !code) {
      throw new HttpException(CaptchaError.PARAM_MISSING, HttpStatus.BAD_REQUEST);
    }
    const key = `${CAPTCHA_CODE_PREFIX}:${uuid}`;
    const cached = await this.redisService.get<string>(key);
    if (!cached) {
      throw new HttpException(CaptchaError.EXPIRED, HttpStatus.BAD_REQUEST);
    }
    if (cached.toLowerCase() !== code.toLowerCase()) {
      throw new HttpException(CaptchaError.WRONG, HttpStatus.BAD_REQUEST);
    }
    // 一次性使用：校验通过立即删除
    await this.redisService.delete(key);
    return true;
  }
}
