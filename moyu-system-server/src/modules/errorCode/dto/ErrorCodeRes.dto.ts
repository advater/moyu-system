import { ApiProperty } from '@nestjs/swagger';

export class ErrorCodeResDTO {
  @ApiProperty({ description: '错误码编号' })
  id: number;

  @ApiProperty({ description: '类型：1 自动 / 2 手动' })
  type: number;

  @ApiProperty({ description: '应用名' })
  applicationName: string;

  @ApiProperty({ description: '错误码' })
  code: number;

  @ApiProperty({ description: '错误提示' })
  message: string;

  @ApiProperty({ description: '备注', required: false })
  memo?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
