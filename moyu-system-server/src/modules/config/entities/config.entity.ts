/**
 * 参数配置实体（对应 sys_config）
 */
export class ConfigDO {
  id: number;
  tenantId: string;
  category: string | null;
  name: string;
  configKey: string;
  value: string;
  visible: boolean;
  remark: string | null;
  creator: string | null;
  updater: string | null;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
  deletedAt: Date | null;
}
