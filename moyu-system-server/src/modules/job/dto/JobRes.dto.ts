import { ApiProperty } from '@nestjs/swagger';

export class JobResDTO {
  @ApiProperty({ description: '任务编号' })
  id: number;

  @ApiProperty({ description: '任务名称' })
  name: string;

  @ApiProperty({ description: '状态：0 停用 / 1 启用' })
  status: number;

  @ApiProperty({ description: '处理器名字' })
  handlerName: string;

  @ApiProperty({ description: '处理器参数', required: false })
  handlerParam?: string;

  @ApiProperty({ description: 'CRON 表达式' })
  cronExpression: string;

  @ApiProperty({ description: '重试次数' })
  retryCount: number;

  @ApiProperty({ description: '重试间隔（秒）' })
  retryInterval: number;

  @ApiProperty({ description: '监控超时（秒），0 不监控' })
  monitorTimeout: number;

  @ApiProperty({ description: '备注', required: false })
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
