import { ApiProperty } from '@nestjs/swagger';

export class ApiAccessLogResDTO {
  @ApiProperty({ description: '日志编号' })
  id: number;

  @ApiProperty({ description: '链路追踪编号', required: false })
  traceId?: string;

  @ApiProperty({ description: '用户编号' })
  userId: number;

  @ApiProperty({ description: '用户类型' })
  userType: number;

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

  @ApiProperty({ description: '浏览器 UA', required: false })
  userAgent?: string;

  @ApiProperty({ description: '开始时间' })
  beginTime: string;

  @ApiProperty({ description: '结束时间' })
  endTime: string;

  @ApiProperty({ description: '执行时长（毫秒）' })
  duration: number;

  @ApiProperty({ description: '结果码' })
  resultCode: number;

  @ApiProperty({ description: '结果提示', required: false })
  resultMsg?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
