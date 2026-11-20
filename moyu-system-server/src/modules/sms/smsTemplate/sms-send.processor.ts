import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SMS_SEND_QUEUE } from '@/config/constants';
import { sendSms, SmsSendStatusEnum } from '../smsChannel/smsChannel.client';
import { SmsLogService } from '../smsLog/smsLog.service';
import { SmsChannelRepository } from '../smsChannel/repositories/smsChannel.repository';
import { TenantContext } from '@/common/tenant/tenant.context';

export interface SmsSendJobData {
  tenantId: string;
  logId: number;
  channelId: number;
  mobile: string;
  apiTemplateId: string;
  templateParams: Record<string, unknown>;
  paramNames: string[];
  content: string;
}

@Processor(SMS_SEND_QUEUE)
@Injectable()
export class SmsSendProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsSendProcessor.name);

  constructor(
    private readonly smsChannelRepository: SmsChannelRepository,
    private readonly smsLogService: SmsLogService,
  ) {
    super();
  }

  async process(job: Job<SmsSendJobData>): Promise<void> {
    const data = job.data;
    await TenantContext.run(
      { tenantId: data.tenantId, ignore: false },
      async () => {
        const channel = await this.smsChannelRepository.selectById(
          data.channelId,
        );
        if (!channel) {
          await this.smsLogService.updateSmsSendResult(data.logId, {
            sendStatus: SmsSendStatusEnum.FAILURE,
            sendTime: new Date(),
            apiSendMsg: '短信渠道不存在',
          });
          return;
        }
        const sendResult = await sendSms(
          {
            code: channel.code,
            signature: channel.signature,
            apiKey: channel.apiKey,
            apiSecret: channel.apiSecret ?? '',
            callbackUrl: channel.callbackUrl ?? undefined,
          },
          {
            mobile: data.mobile,
            apiTemplateId: data.apiTemplateId,
            templateParams: data.templateParams,
            paramNames: data.paramNames,
            content: data.content,
            callbackUrl: channel.callbackUrl ?? undefined,
          },
        );
        await this.smsLogService.updateSmsSendResult(data.logId, {
          sendStatus: sendResult.success
            ? SmsSendStatusEnum.SUCCESS
            : SmsSendStatusEnum.FAILURE,
          sendTime: new Date(),
          apiSendCode: sendResult.apiSendCode,
          apiSendMsg: sendResult.apiSendMsg,
          apiRequestId: sendResult.apiRequestId,
          apiSerialNo: sendResult.apiSerialNo,
        });
        if (!sendResult.success) {
          const msg = sendResult.apiSendMsg || '短信发送失败';
          this.logger.warn(`短信异步发送失败 logId=${data.logId}: ${msg}`);
          throw new Error(msg);
        }
      },
    );
  }
}
