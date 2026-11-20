export interface Route {
  path: string;
  module?: any;
  children?: Route[];
}

/**
 * 路由配置
 */
// ─── 系统管理 ──────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { SystemConfigModule } from './modules/config/config.module';
import { DeptModule } from './modules/dept/dept/dept.module';
import { PostModule } from './modules/dept/post/post.module';
import { DictDataModule } from './modules/dict/dictData/dictData.module';
import { DictTypeModule } from './modules/dict/dictType/dictType.module';
import { ErrorCodeModule } from './modules/errorCode/errorCode.module';
import { FileModule } from './modules/file/file.module';
import { IpModule } from './modules/ip/ip.module';
import { JobModule } from './modules/job/job.module';
import { JobLogModule } from './modules/job/job-log.module';
import { ApiAccessLogModule } from './modules/logger/apiAccessLog/apiAccessLog.module';
import { ApiErrorLogModule } from './modules/logger/apiErrorLog/apiErrorLog.module';
import { LoginLogModule } from './modules/logger/loginLog/loginLog.module';
import { OperateLogModule } from './modules/logger/operateLog/operateLog.module';
import { MailAccountModule } from './modules/mail/mailAccount/mailAccount.module';
import { MailLogModule } from './modules/mail/mailLog/mailLog.module';
import { MailTemplateModule } from './modules/mail/mailTemplate/mailTemplate.module';
import { NoticeModule } from './modules/notice/notice.module';
import { NotifyMessageModule } from './modules/notify/notifyMessage/notifyMessage.module';
import { NotifyTemplateModule } from './modules/notify/notifyTemplate/notifyTemplate.module';
import { OAuth2ClientModule } from './modules/oauth2/oauth2Client/oauth2Client.module';
import { OAuth2TokenModule } from './modules/oauth2/oauth2Token/oauth2Token.module';
import { OAuth2OpenModule } from './modules/oauth2/oauth2Open/oauth2Open.module';
import { OAuth2UserModule } from './modules/oauth2/oauth2User/oauth2User.module';
import { MenuModule } from './modules/permission/menu/menu.module';
import { PermissionModule } from './modules/permission/permission/permission.module';
import { RoleModule } from './modules/permission/role/role.module';
import { SmsCallbackModule } from './modules/sms/smsCallback/smsCallback.module';
import { SmsChannelModule } from './modules/sms/smsChannel/smsChannel.module';
import { SmsLogModule } from './modules/sms/smsLog/smsLog.module';
import { SmsTemplateModule } from './modules/sms/smsTemplate/smsTemplate.module';
import { SocialClientModule } from './modules/social/socialClient/socialClient.module';
import { SocialUserModule } from './modules/social/socialUser/socialUser.module';
import { TenantModule } from './modules/tenant/tenant/tenant.module';
import { TenantPackageModule } from './modules/tenant/tenantPackage/tenantPackage.module';
import { UserModule } from './modules/user/user/user.module';
import { UserProfileModule } from './modules/user/userProfile/userProfile.module';

// ─── 公共模块（不挂载 /admin 前缀） ──────────────────────
import { HealthModule } from './health/health.module';

export const AppRoutes: Route[] = [
  // ─── 管理接口（再加全局前缀后为 /admin/<资源>，不再使用 /system 段） ─────────────
  { path: 'auth', module: AuthModule },
  { path: 'captcha', module: CaptchaModule },
  { path: 'config', module: SystemConfigModule },
  { path: 'dept', module: DeptModule },
  { path: 'post', module: PostModule },
  { path: 'dict-data', module: DictDataModule },
  { path: 'dict-type', module: DictTypeModule },
  { path: 'error-code', module: ErrorCodeModule },
  { path: 'file', module: FileModule },
  { path: 'area', module: IpModule },
  { path: 'job', module: JobModule },
  { path: 'job-log', module: JobLogModule },
  { path: 'api-access-log', module: ApiAccessLogModule },
  { path: 'api-error-log', module: ApiErrorLogModule },
  { path: 'login-log', module: LoginLogModule },
  { path: 'operate-log', module: OperateLogModule },
  { path: 'mail-account', module: MailAccountModule },
  { path: 'mail-log', module: MailLogModule },
  { path: 'mail-template', module: MailTemplateModule },
  { path: 'notice', module: NoticeModule },
  { path: 'notify-message', module: NotifyMessageModule },
  { path: 'notify-template', module: NotifyTemplateModule },
  { path: 'oauth2-client', module: OAuth2ClientModule },
  { path: 'oauth2-token', module: OAuth2TokenModule },
  { path: 'oauth2-open', module: OAuth2OpenModule },
  { path: 'oauth2-user', module: OAuth2UserModule },
  { path: 'menu', module: MenuModule },
  { path: 'permission', module: PermissionModule },
  { path: 'role', module: RoleModule },
  { path: 'sms-callback', module: SmsCallbackModule },
  { path: 'sms-channel', module: SmsChannelModule },
  { path: 'sms-log', module: SmsLogModule },
  { path: 'sms-template', module: SmsTemplateModule },
  { path: 'social-client', module: SocialClientModule },
  { path: 'social-user', module: SocialUserModule },
  { path: 'tenant', module: TenantModule },
  { path: 'tenant-package', module: TenantPackageModule },
  { path: 'user', module: UserModule },
  { path: 'user-profile', module: UserProfileModule },
  { path: 'health', module: HealthModule },
];
