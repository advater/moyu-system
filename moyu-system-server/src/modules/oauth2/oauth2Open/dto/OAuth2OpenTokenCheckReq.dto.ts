import { ValidationError } from '@/config/error-messages';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** OAuth2 check-token / revoke-token 请求体（禁止仅靠 Query 传令牌） */
export class OAuth2OpenTokenCheckReqDTO {
  @ApiProperty({
    description: '访问令牌',
    required: true,
    example: 'a1b2c3...',
  })
  @IsNotEmpty({ message: ValidationError.TOKEN_REQUIRED })
  @IsString()
  token: string;
}
