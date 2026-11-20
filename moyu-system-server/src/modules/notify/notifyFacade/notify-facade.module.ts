import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { MailTemplateModule } from '@/modules/mail/mailTemplate/mailTemplate.module';
import { MailTemplateService } from '@/modules/mail/mailTemplate/mailTemplate.service';
import { SmsTemplateModule } from '@/modules/sms/smsTemplate/smsTemplate.module';
import { SmsTemplateService } from '@/modules/sms/smsTemplate/smsTemplate.service';
import { NotifyTemplateModule } from '@/modules/notify/notifyTemplate/notifyTemplate.module';
import { NotifyTemplateService } from '@/modules/notify/notifyTemplate/notifyTemplate.service';

export interface NotifyEventPayload {
  /** 站内信 / 邮件 / 短信 共用模版编码（各渠道独立表，编码可相同） */
  templateCode: string;
  templateParams?: Record<string, string>;
  /** 站内信接收用户 */
  userId?: number;
  userType?: number;
  /** 邮件 */
  toMails?: string[];
  ccMails?: string[];
  bccMails?: string[];
  /** 短信 */
  mobile?: string;
  /** 渠道开关，默认全开（有目标才发） */
  channels?: {
    notify?: boolean;
    mail?: boolean;
    sms?: boolean;
  };
}

export interface NotifyEventResult {
  notifyMessageId?: number;
  mailLogId?: number;
  smsLogId?: number;
  errors: string[];
}

/**
 * 统一消息门面：同一业务事件可路由到站内信 / 邮件 / 短信
 */
@Injectable()
export class NotifyFacade {
  private readonly logger = new Logger(NotifyFacade.name);

  constructor(
    private readonly notifyTemplateService: NotifyTemplateService,
    private readonly mailTemplateService: MailTemplateService,
    private readonly smsTemplateService: SmsTemplateService,
  ) {}

  async publish(event: NotifyEventPayload): Promise<NotifyEventResult> {
    const channels = event.channels ?? {};
    const wantNotify = channels.notify !== false;
    const wantMail = channels.mail !== false;
    const wantSms = channels.sms !== false;
    const result: NotifyEventResult = { errors: [] };

    if (wantNotify && event.userId != null) {
      try {
        result.notifyMessageId = await this.notifyTemplateService.sendNotify({
          userId: event.userId,
          userType: event.userType ?? 1,
          templateCode: event.templateCode,
          templateParams: event.templateParams,
        });
      } catch (err) {
        const msg = `notify: ${(err as Error).message}`;
        result.errors.push(msg);
        this.logger.warn(msg);
      }
    }

    if (wantMail && event.toMails?.length) {
      try {
        result.mailLogId = await this.mailTemplateService.sendMail({
          templateCode: event.templateCode,
          templateParams: event.templateParams,
          toMails: event.toMails,
          ccMails: event.ccMails ?? [],
          bccMails: event.bccMails ?? [],
        });
      } catch (err) {
        const msg = `mail: ${(err as Error).message}`;
        result.errors.push(msg);
        this.logger.warn(msg);
      }
    }

    if (wantSms && event.mobile) {
      try {
        result.smsLogId = await this.smsTemplateService.sendSms({
          mobile: event.mobile,
          templateCode: event.templateCode,
          templateParams: event.templateParams,
        });
      } catch (err) {
        const msg = `sms: ${(err as Error).message}`;
        result.errors.push(msg);
        this.logger.warn(msg);
      }
    }

    return result;
  }
}

@Global()
@Module({
  imports: [NotifyTemplateModule, MailTemplateModule, SmsTemplateModule],
  providers: [NotifyFacade],
  exports: [NotifyFacade],
})
export class NotifyFacadeModule {}
