import { IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OAuth2OpenAuthorizeClientDTO } from './OAuth2OpenAuthorizeClient.dto';

/**
 * 授权页的信息
 */
export class OAuth2OpenAuthorizeInfoResDTO {
  @ApiProperty({
    description: '客户端',
    required: false,
    type: OAuth2OpenAuthorizeClientDTO,
  })
  @IsOptional()
  client?: OAuth2OpenAuthorizeClientDTO;

  @ApiProperty({
    description:
      'scope 的选中信息,使用 List 保证有序性，Key 是 scope，Value 为是否选中',
    required: true,
  })
  @IsArray()
  scopes: { key: string; value: boolean }[];
}
