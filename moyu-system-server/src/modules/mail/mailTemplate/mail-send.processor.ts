import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { MAIL_SEND_QUEUE } from '@/config/constants';
import { MailLogRepository } from '@/modules/mail/mailLog/repositories/mailLog.repository';
import { MailAccountRepository } from '@/modules/mail/mailAccount/repositories/mailAccount.repository';
import { TenantContext } from '@/common/tenant/tenant.context';

export interface MailSendJobData {
  tenantId: string;
  logId: number;
  accountId: number;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
}

@Processor(MAIL_SEND_QUEUE)
@Injectable()
export class MailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(MailSendProcessor.name);

  constructor(
    private readonly mailLogRepository: MailLogRepository,
    private readonly mailAccountRepository: MailAccountRepository,
  ) {
    super();
  }

  async process(job: Job<MailSendJobData>): Promise<void> {
    const data = job.data;
    await TenantContext.run(
      { tenantId: data.tenantId, ignore: false },
      async () => {
        const account = await this.mailAccountRepository.selectById(
          data.accountId,
        );
        if (!account) {
          await this.mailLogRepository.updateById(data.logId, {
            sendStatus: 20,
            sendTime: new Date(),
            sendException: '发件账号不存在',
          });
          return;
        }
        try {
          const transporter = nodemailer.createTransport({
            host: account.host,
            port: account.port,
            secure: account.sslEnable,
            requireTLS: account.starttlsEnable,
            auth: {
              user: account.username,
              pass: account.password,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
          });
          const info = await transporter.sendMail({
            from: data.from,
            to: data.to,
            ...(data.cc?.length ? { cc: data.cc } : {}),
            ...(data.bcc?.length ? { bcc: data.bcc } : {}),
            subject: data.subject,
            html: data.html,
            text: data.html,
          });
          await this.mailLogRepository.updateById(data.logId, {
            sendStatus: 10,
            sendTime: new Date(),
            sendMessageId: info.messageId ?? null,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`邮件异步发送失败 logId=${data.logId}: ${msg}`);
          await this.mailLogRepository.updateById(data.logId, {
            sendStatus: 20,
            sendTime: new Date(),
            sendException: msg,
          });
          throw error;
        }
      },
    );
  }
}
