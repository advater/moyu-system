import { ApiProperty } from '@nestjs/swagger';

export class JobLogResDTO {
  @ApiProperty({ description: '日志编号' })
  id: number;

  @ApiProperty({ description: '任务编号' })
  jobId: number;

  @ApiProperty({ description: '处理器名字' })
  handlerName: string;

  @ApiProperty({ description: '处理器参数', required: false })
  handlerParam?: string;

  @ApiProperty({ description: '第几次执行' })
  executeIndex: number;

  @ApiProperty({ description: '开始时间' })
  beginTime: string;

  @ApiProperty({ description: '结束时间', required: false })
  endTime?: string;

  @ApiProperty({ description: '执行时长（毫秒）', required: false })
  duration?: number;

  @ApiProperty({ description: '状态：0 成功 / 1 失败' })
  status: number;

  @ApiProperty({ description: '执行结果', required: false })
  result?: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;
}
