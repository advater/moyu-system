import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 授权页展示的客户端摘要
 */
export class OAuth2OpenAuthorizeClientDTO {
  @ApiProperty({ description: '应用名', required: true, example: 'moyu' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '应用图标',
    required: true,
    example: 'https://www.moyu.cn/xx.png',
  })
  @IsString()
  logo: string;
}
