// ─── 系统管理 ──────────────────────────────────────────
import { AuthModule } from './auth/auth.module';
import { CaptchaModule } from './captcha/captcha.module';
import { SystemConfigModule } from './config/config.module';
import { DeptModule } from './dept/dept/dept.module';
import { PostModule } from './dept/post/post.module';
import { DictDataModule } from './dict/dictData/dictData.module';
import { DictTypeModule } from './dict/dictType/dictType.module';
import { ErrorCodeModule } from './errorCode/errorCode.module';
import { FileModule } from './file/file.module';
import { IpModule } from './ip/ip.module';
import { JobModule } from './job/job.module';
import { JobLogModule } from './job/job-log.module';
import { ApiAccessLogModule } from './logger/apiAccessLog/apiAccessLog.module';
import { ApiErrorLogModule } from './logger/apiErrorLog/apiErrorLog.module';
import { LoginLogModule } from './logger/loginLog/loginLog.module';
import { OperateLogModule } from './logger/operateLog/operateLog.module';
import { MailAccountModule } from './mail/mailAccount/mailAccount.module';
import { MailLogModule } from './mail/mailLog/mailLog.module';
import { MailTemplateModule } from './mail/mailTemplate/mailTemplate.module';
import { NoticeModule } from './notice/notice.module';
import { NotifyMessageModule } from './notify/notifyMessage/notifyMessage.module';
import { NotifyTemplateModule } from './notify/notifyTemplate/notifyTemplate.module';
import { NotifyFacadeModule } from './notify/notifyFacade/notify-facade.module';
import { OAuth2ClientModule } from './oauth2/oauth2Client/oauth2Client.module';
import { OAuth2TokenModule } from './oauth2/oauth2Token/oauth2Token.module';
import { OAuth2OpenModule } from './oauth2/oauth2Open/oauth2Open.module';
import { OAuth2UserModule } from './oauth2/oauth2User/oauth2User.module';
import { MenuModule } from './permission/menu/menu.module';
import { PermissionModule } from './permission/permission/permission.module';
import { RoleModule } from './permission/role/role.module';
import { SmsCallbackModule } from './sms/smsCallback/smsCallback.module';
import { SmsChannelModule } from './sms/smsChannel/smsChannel.module';
import { SmsLogModule } from './sms/smsLog/smsLog.module';
import { SmsTemplateModule } from './sms/smsTemplate/smsTemplate.module';
import { SocialClientModule } from './social/socialClient/socialClient.module';
import { SocialUserModule } from './social/socialUser/socialUser.module';
import { TenantModule } from './tenant/tenant/tenant.module';
import { TenantPackageModule } from './tenant/tenantPackage/tenantPackage.module';
import { TenantPolicyModule } from './tenant/policy/tenant-policy.module';
import { UserModule } from './user/user/user.module';
import { UserProfileModule } from './user/userProfile/userProfile.module';

/** 所有 Module — 解构注册到 AppModule */
export const FeatureModules = [
  AuthModule,
  CaptchaModule,
  SystemConfigModule,
  DeptModule,
  PostModule,
  DictDataModule,
  DictTypeModule,
  ErrorCodeModule,
  FileModule,
  IpModule,
  JobModule,
  JobLogModule,
  ApiAccessLogModule,
  ApiErrorLogModule,
  LoginLogModule,
  OperateLogModule,
  MailAccountModule,
  MailLogModule,
  MailTemplateModule,
  NoticeModule,
  NotifyMessageModule,
  NotifyTemplateModule,
  NotifyFacadeModule,
  OAuth2ClientModule,
  OAuth2TokenModule,
  OAuth2OpenModule,
  OAuth2UserModule,
  MenuModule,
  PermissionModule,
  RoleModule,
  SmsCallbackModule,
  SmsChannelModule,
  SmsLogModule,
  SmsTemplateModule,
  SocialClientModule,
  SocialUserModule,
  TenantModule,
  TenantPackageModule,
  TenantPolicyModule,
  UserModule,
  UserProfileModule,
];
