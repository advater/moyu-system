export class ErrorCodeDO {
  id: number;
  tenantId: string;
  type: number;
  applicationName: string;
  code: number;
  message: string;
  memo: string | null;
  creator: string | null;
  updater: string | null;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
  deletedAt: Date | null;
}
