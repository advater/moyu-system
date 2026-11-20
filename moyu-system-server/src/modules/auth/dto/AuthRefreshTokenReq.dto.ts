import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 刷新令牌请求
 * - 优先读 httpOnly Cookie `moyu_rt`
 * - Body.refreshToken 兼容非浏览器客户端
 */
export class AuthRefreshTokenReqDTO {
  @ApiPropertyOptional({
    description: '刷新令牌（可选；未传则读 Cookie moyu_rt）',
    example: 'rt_xxxx',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
