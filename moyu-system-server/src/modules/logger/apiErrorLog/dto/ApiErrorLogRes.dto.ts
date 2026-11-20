import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorLogResDTO {
  @ApiProperty({ description: '日志编号' })
  id: number;

  @ApiProperty({ description: '链路追踪编号', required: false })
  traceId?: string;

  @ApiProperty({ description: '用户编号' })
  userId: number;

  @ApiProperty({ description: '应用名' })
  applicationName: string;

  @ApiProperty({ description: '请求方法' })
  requestMethod: string;

  @ApiProperty({ description: '请求地址' })
  requestUrl: string;

  @ApiProperty({ description: '请求参数', required: false })
  requestParams?: string;

  @ApiProperty({ description: '用户 IP', required: false })
  userIp?: string;

  @ApiProperty({ description: '异常发生时间' })
  exceptionTime: string;

  @ApiProperty({ description: '异常名' })
  exceptionName: string;

  @ApiProperty({ description: '异常信息', required: false })
  exceptionMessage?: string;

  @ApiProperty({ description: '异常堆栈', required: false })
  exceptionStackTrace?: string;

  @ApiProperty({ description: '处理状态：0 未处理 / 1 已处理 / 2 已忽略' })
  processStatus: number;

  @ApiProperty({ description: '处理时间', required: false })
  processTime?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
