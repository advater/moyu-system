import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageParam } from '@/types/pageParam';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 社交客户端分页
 */
export class SocialClientPageReqDTO extends PageParam {
  @ApiProperty({ description: '应用名', required: false, example: 'moyu商城' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '社交平台的类型', required: false, example: 31 })
  @IsOptional()
  @IsNumber()
  socialType?: number;

  @ApiProperty({ description: '用户类型', required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  userType?: number;

  @ApiProperty({ description: '客户端编号', required: false, example: '145442115' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: '状态', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

}
