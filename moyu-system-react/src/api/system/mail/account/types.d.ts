export interface MailAccountVO {
  id?: number;
  mail: string;
  username: string;
  password?: string;
  host: string;
  port: number;
  sslEnable: boolean;
  starttlsEnable: boolean;
}

