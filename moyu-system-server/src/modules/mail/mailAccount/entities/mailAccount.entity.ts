import { TenantBaseDO } from '@/types/tenantBase.do';

/**
 * 邮箱账号实体
 */
export class MailAccountDO extends TenantBaseDO {
  /**
   * 邮箱账号ID 自增主键
   */
  id: number;
  /**
   * 邮箱
   */
  mail: string;
  /**
   * 用户名
   */
  username: string;
  /**
   * 密码
   */
  password: string;
  /**
   * SMTP 服务器域名
   */
  host: string;
  /**
   * SMTP 服务器端口
   */
  port: number;
  /**
   * 是否开启 SSL
   */
  ssl_enable: boolean;
  /**
   * 是否开启 STARTTLS
   */
  starttls_enable: boolean;
}
